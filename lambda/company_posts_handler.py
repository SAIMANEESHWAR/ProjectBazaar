"""
Company Posts API — DynamoDB + HTTP API (Python 3.12)

Table: partition key `postId` only (no GSIs). GET /posts uses Scan + optional FilterExpression,
then sorts by `createdAt` in Lambda. Suitable for modest table sizes; add GSIs if Scan cost or
latency becomes an issue.

Env: POSTS_TABLE_NAME (optional, defaults to company-posts-dev-posts), STAGE (optional, default dev)

Routes:
  POST   /posts           — create (JSON). isAnonymous=true → no authorUserId stored, authorName "Anonymous".
  GET    /posts           — list. Query: company, category, authorUserId|authorId, limit (1–100), nextToken.
  GET    /posts/{postId}  — get one
  PATCH  /posts/{postId}  — {"action": "upvote"} | {"action": "addComment", "author": "...", "text": "..."}
  Upvote: requires header x-user-id; each user increments upvotes at most once (tracked in upvoteUserIds, not returned to clients).

nextToken for GET /posts: JSON offset into the sorted full result set (each request rescans the table).

Non-anonymous: header x-user-id or body.authorUserId / body.authorId (frontend CompanyPost.authorId).

Field rules per category match frontend normalizeCompanyPostForCategory (CompanyPostsPage.tsx).

SAM (lambda/company-posts): Handler company_posts_handler.lambda_handler, CodeUri ../
"""

import base64
import json
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

POST_CATEGORIES = frozenset(
    {
        "interview-experience",
        "company-feedback",
        "salary-compensation",
        "career-discussion",
    }
)

OFFER_TYPES = frozenset({"Internship", "Full-time", "Intern + PPO"})

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-user-id,x-user-name",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
}

STAGE = os.environ.get("STAGE", "dev")

# Default table when POSTS_TABLE_NAME is not set (copy-paste deploy in console).
DEFAULT_POSTS_TABLE_NAME = "company-posts-dev-posts"

_dynamodb = None
_table = None


def _get_table():
    global _dynamodb, _table
    name = (os.environ.get("POSTS_TABLE_NAME") or DEFAULT_POSTS_TABLE_NAME).strip()
    if not name:
        return None
    if _table is None:
        _dynamodb = boto3.resource("dynamodb")
        _table = _dynamodb.Table(name)
    return _table


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def get_path(event):
    return event.get("rawPath") or event.get("path") or "/"


def get_method(event):
    ctx = event.get("requestContext") or {}
    http = ctx.get("http") or {}
    return (http.get("method") or event.get("httpMethod") or "GET").upper()


def parse_body(event):
    raw = event.get("body")
    if not raw:
        return {}
    try:
        if event.get("isBase64Encoded"):
            raw = base64.b64decode(raw).decode("utf-8")
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return None


def parse_query(event):
    q = event.get("queryStringParameters") or {}
    if not q:
        q = {}
    lim = int(q.get("limit") or 25)
    lim = max(1, min(100, lim))
    author = q.get("authorUserId") or q.get("authorId")
    return {
        "company": q.get("company"),
        "category": q.get("category"),
        "authorUserId": author,
        "postId": q.get("postId") or q.get("id"),
        "limit": lim,
        "nextToken": q.get("nextToken"),
    }


def decode_next_token(token):
    if not token:
        return None
    try:
        pad = "=" * (-len(token) % 4)
        blob = base64.urlsafe_b64decode(token + pad)
        return json.loads(blob.decode("utf-8"))
    except (json.JSONDecodeError, ValueError):
        return None


def encode_next_token(key):
    if not key:
        return None
    raw = json.dumps(key, separators=(",", ":"), default=str)
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")


def _coerce_company_rating(body):
    """Match frontend: companyRating as number 1–5 (JSON may send string)."""
    if body.get("category") != "company-feedback":
        return
    r = body.get("companyRating")
    if isinstance(r, str):
        try:
            body["companyRating"] = int(float(r.strip()))
        except ValueError:
            pass


def validate_create_payload(body):
    errors = []
    if not isinstance(body, dict):
        return ["Invalid JSON body"]

    _coerce_company_rating(body)

    category = body.get("category")
    if category not in POST_CATEGORIES:
        errors.append(f"category must be one of: {', '.join(sorted(POST_CATEGORIES))}")

    title = (body.get("title") or "").strip() if isinstance(body.get("title"), str) else ""
    content = (body.get("content") or "").strip() if isinstance(body.get("content"), str) else ""
    if not title:
        errors.append("title is required")
    if not content:
        errors.append("content is required")

    company_name = (body.get("companyName") or "").strip() if isinstance(body.get("companyName"), str) else ""
    require_company = category in (
        "interview-experience",
        "company-feedback",
        "salary-compensation",
    )
    if require_company and not company_name:
        errors.append("companyName is required for this category")

    role = (body.get("role") or "").strip() if isinstance(body.get("role"), str) else ""
    require_role = category in ("interview-experience", "salary-compensation")
    if require_role and not role:
        errors.append("role is required for this category")

    if category == "salary-compensation":
        pd = body.get("packageDetails") or {}
        ctc = str(pd.get("ctc", "")).strip() if pd.get("ctc") is not None else ""
        if not ctc:
            errors.append("packageDetails.ctc is required for salary posts")
        elif not re.search(r"\d", ctc):
            errors.append("packageDetails.ctc should include a number")
        ot = pd.get("offerType")
        if ot is not None and ot != "" and ot not in OFFER_TYPES:
            errors.append("packageDetails.offerType is invalid")

    if category == "company-feedback":
        r = body.get("companyRating")
        if not isinstance(r, (int, float)) or r < 1 or r > 5:
            errors.append("companyRating must be 1–5 for company-feedback")

    return errors


def _clean_item_for_put(item):
    """Drop None values so DynamoDB does not store NULLs unnecessarily."""
    return {k: v for k, v in item.items() if v is not None}


def normalize_item_for_category(category, item):
    """
    Mirror frontend normalizeCompanyPostForCategory — only persist fields that belong to the category.
    """
    out = dict(item)

    if category == "salary-compensation":
        pd = out.get("packageDetails")
        if isinstance(pd, dict):
            ot = pd.get("offerType")
            if ot is not None and ot != "" and ot not in OFFER_TYPES:
                pd = {k: v for k, v in pd.items() if k != "offerType"}
            out["packageDetails"] = pd
        else:
            out["packageDetails"] = None
    else:
        out["packageDetails"] = None

    if category == "company-feedback":
        r = out.get("companyRating")
        if isinstance(r, Decimal):
            r = int(r) if r % 1 == 0 else float(r)
        if isinstance(r, (int, float)) and 1 <= r <= 5:
            out["companyRating"] = int(r)
        else:
            out["companyRating"] = None
    else:
        out["companyRating"] = None

    if category == "career-discussion":
        ct = out.get("careerTopic")
        out["careerTopic"] = ct.strip() if isinstance(ct, str) and ct.strip() else None
    else:
        out["careerTopic"] = None

    if category == "interview-experience":
        ir = out.get("interviewRound")
        out["interviewRound"] = ir.strip() if isinstance(ir, str) and ir.strip() else None
    else:
        out["interviewRound"] = None

    return _clean_item_for_put(out)


def build_post_item(body, identity):
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    post_id = str(uuid.uuid4())
    is_anonymous = bool(body.get("isAnonymous"))

    author_user_id = None if is_anonymous else (identity.get("userId") or None)
    if author_user_id:
        author_user_id = str(author_user_id).strip() or None

    if is_anonymous:
        author_name = "Anonymous"
    else:
        an = body.get("authorName")
        author_name = (
            an.strip()
            if isinstance(an, str) and an.strip()
            else (identity.get("userName") or "User")
        )

    category = body.get("category")
    cn_raw = (body.get("companyName") or "").strip() if isinstance(body.get("companyName"), str) else ""
    company_name = cn_raw or "General"

    role_raw = (body.get("role") or "").strip() if isinstance(body.get("role"), str) else ""
    tags = body.get("tags") if isinstance(body.get("tags"), list) else []
    comments = body.get("comments") if isinstance(body.get("comments"), list) else []
    upvotes = body.get("upvotes")
    if not isinstance(upvotes, (int, float)):
        upvotes = 0
    upvotes = int(upvotes)

    client_meta = body.get("clientMeta")
    if not isinstance(client_meta, dict):
        client_meta = None

    item = {
        "postId": post_id,
        "createdAt": now,
        "updatedAt": now,
        "schemaVersion": 1,
        "stage": STAGE,
        "category": category,
        "companyName": company_name,
        "isAnonymous": is_anonymous,
        "authorUserId": author_user_id,
        "authorName": author_name,
        "isAdminCompany": bool(body.get("isAdminCompany")),
        "role": role_raw or "General",
        "title": (body.get("title") or "").strip() if isinstance(body.get("title"), str) else "",
        "content": (body.get("content") or "").strip() if isinstance(body.get("content"), str) else "",
        "location": body.get("location"),
        "experienceLevel": body.get("experienceLevel"),
        "interviewRound": body.get("interviewRound"),
        "packageDetails": body.get("packageDetails"),
        "companyRating": body.get("companyRating"),
        "careerTopic": body.get("careerTopic"),
        "tags": tags,
        "upvotes": upvotes,
        "comments": comments,
        "clientMeta": client_meta,
    }
    return _clean_item_for_put(item)


def _upvote_id_set(raw):
    if raw is None:
        return set()
    if isinstance(raw, set):
        return {str(x) for x in raw}
    if isinstance(raw, (list, tuple)):
        return {str(x) for x in raw}
    return set()


def fix_public_shape(item, viewer_user_id=None):
    if not item:
        return None
    out = {}
    for k, v in item.items():
        if isinstance(v, Decimal):
            out[k] = int(v) if v == int(v) else float(v)
        else:
            out[k] = v
    upvote_ids = _upvote_id_set(out.pop("upvoteUserIds", None))
    post_id = out.pop("postId", None)
    out.pop("allPostsPk", None)
    out.pop("authorIndexPk", None)
    out["id"] = post_id
    # Frontend CompanyPost.authorId — DynamoDB attribute is authorUserId
    aid = out.pop("authorUserId", None)
    out["authorId"] = aid
    vu = (
        viewer_user_id.strip()
        if isinstance(viewer_user_id, str) and viewer_user_id.strip()
        else ""
    )
    out["hasUpvoted"] = bool(vu and vu in upvote_ids)
    return out


def _header(event, *names):
    h = event.get("headers") or {}
    lower = {k.lower(): v for k, v in h.items()}
    for n in names:
        v = lower.get(n.lower())
        if v:
            return v
    return None


def _authorizer_user_id(event):
    ctx = event.get("requestContext") or {}
    auth = ctx.get("authorizer") or {}
    claims = (auth.get("jwt") or {}).get("claims") or auth.get("claims") or {}
    if not isinstance(claims, dict):
        return None
    return claims.get("sub") or claims.get("custom:userId") or claims.get("username")


def handle_create(event, table):
    body = parse_body(event)
    if body is None:
        return response(400, {"error": "Invalid JSON"})

    errors = validate_create_payload(body)
    if errors:
        return response(400, {"error": "Validation failed", "details": errors})

    identity = {
        "userId": _header(event, "x-user-id")
        or _authorizer_user_id(event)
        or body.get("authorUserId")
        or body.get("authorId"),
        "userName": _header(event, "x-user-name") or body.get("authorName"),
    }

    if not body.get("isAnonymous"):
        uid = identity.get("userId")
        if not (isinstance(uid, str) and uid.strip()):
            return response(
                400,
                {
                    "error": "Non-anonymous posts require a stable user id "
                    "(header x-user-id, body.authorUserId, or body.authorId)",
                },
            )

    item = build_post_item(body, identity)
    item = normalize_item_for_category(body.get("category"), item)
    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(postId)",
        )
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return response(409, {"error": "Conflict"})
        raise
    viewer = identity.get("userId")
    viewer = viewer.strip() if isinstance(viewer, str) else ""
    return response(201, {"post": fix_public_shape(item, viewer or None)})


def handle_get_one(post_id, table, event):
    res = table.get_item(Key={"postId": post_id})
    row = res.get("Item")
    if not row:
        return response(404, {"error": "Not found"})
    viewer = (_header(event, "x-user-id") or _authorizer_user_id(event) or "").strip()
    return response(200, {"post": fix_public_shape(row, viewer or None)})


def _list_scan_filter_expression(q):
    """Combine filters with AND (no GSI — applied during Scan)."""
    company = q.get("company")
    category = q.get("category")
    author = q.get("authorUserId")

    parts = []
    if company:
        parts.append(Attr("companyName").eq((company or "").strip() or "General"))
    if category:
        parts.append(Attr("category").eq(category))
    if author:
        parts.append(Attr("authorUserId").eq(author.strip()))

    if not parts:
        return None
    expr = parts[0]
    for p in parts[1:]:
        expr = expr & p
    return expr


def handle_list(event, table):
    q = parse_query(event)
    limit = q["limit"]
    token_payload = decode_next_token(q["nextToken"]) or {}
    try:
        offset = max(0, int(token_payload.get("offset", 0)))
    except (TypeError, ValueError):
        offset = 0

    fe = _list_scan_filter_expression(q)
    scan_kw = {}
    if fe is not None:
        scan_kw["FilterExpression"] = fe

    items = []
    last_key = None
    while True:
        kw = dict(scan_kw)
        if last_key:
            kw["ExclusiveStartKey"] = last_key
        resp = table.scan(**kw)
        items.extend(resp.get("Items", []))
        last_key = resp.get("LastEvaluatedKey")
        if not last_key:
            break

    items.sort(key=lambda x: str(x.get("createdAt") or ""), reverse=True)
    page = items[offset : offset + limit]
    viewer = (_header(event, "x-user-id") or _authorizer_user_id(event) or "").strip()
    posts = [fix_public_shape(i, viewer or None) for i in page]

    next_tok = None
    if offset + limit < len(items):
        next_tok = encode_next_token({"offset": offset + limit})

    return response(
        200,
        {
            "posts": posts,
            "nextToken": next_tok,
            "count": len(posts),
            "totalMatched": len(items),
        },
    )


def handle_patch(post_id, event, table):
    body = parse_body(event)
    if body is None:
        return response(400, {"error": "Invalid JSON"})

    action = body.get("action")
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    if action == "upvote":
        uid = (_header(event, "x-user-id") or _authorizer_user_id(event) or "").strip()
        if not uid:
            return response(
                400,
                {"error": "Sign in required (header x-user-id) to mark a post as helpful"},
            )
        uid_set = {uid}
        try:
            res = table.update_item(
                Key={"postId": post_id},
                UpdateExpression="ADD upvotes :one, upvoteUserIds :uids SET updatedAt = :u",
                ConditionExpression="attribute_not_exists(upvoteUserIds) OR NOT contains(upvoteUserIds, :uid)",
                ExpressionAttributeValues={
                    ":one": 1,
                    ":uids": uid_set,
                    ":u": now,
                    ":uid": uid,
                },
                ReturnValues="ALL_NEW",
            )
        except ClientError as e:
            if e.response["Error"]["Code"] != "ConditionalCheckFailedException":
                raise
            got = table.get_item(Key={"postId": post_id})
            row = got.get("Item")
            if not row:
                return response(404, {"error": "Not found"})
            return response(
                200,
                {"post": fix_public_shape(row, uid), "alreadyUpvoted": True},
            )
        return response(200, {"post": fix_public_shape(res.get("Attributes"), uid)})

    if action == "addComment":
        author = (body.get("author") or "").strip() if isinstance(body.get("author"), str) else ""
        text = (body.get("text") or "").strip() if isinstance(body.get("text"), str) else ""
        if not author or not text:
            return response(400, {"error": "addComment requires author and text"})
        comment = {
            "id": str(uuid.uuid4()),
            "author": author,
            "text": text,
            "createdAt": now,
        }
        res = table.update_item(
            Key={"postId": post_id},
            UpdateExpression="SET comments = list_append(if_not_exists(comments, :empty), :c), updatedAt = :u",
            ExpressionAttributeValues={":empty": [], ":c": [comment], ":u": now},
            ReturnValues="ALL_NEW",
        )
        voter = (_header(event, "x-user-id") or _authorizer_user_id(event) or "").strip()
        return response(
            200,
            {
                "post": fix_public_shape(res.get("Attributes"), voter or None),
                "comment": comment,
            },
        )

    return response(400, {"error": "Unknown action; use upvote or addComment"})


def extract_post_id(path):
    parts = [p for p in path.split("/") if p]
    try:
        idx = parts.index("posts")
    except ValueError:
        return None
    if idx + 1 < len(parts):
        return parts[idx + 1]
    return None


def lambda_handler(event, context):
    table = _get_table()
    if table is None:
        return response(500, {"error": "DynamoDB table name is empty; set POSTS_TABLE_NAME or use default."})

    method = get_method(event)
    path = get_path(event)

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    try:
        post_id = extract_post_id(path)
        query = parse_query(event)

        # Accept both /posts and direct base function URL paths.
        if method == "POST" and (path == "/posts" or path.rstrip("/").endswith("/posts") or not post_id):
            return handle_create(event, table)

        if method == "GET" and post_id:
            return handle_get_one(post_id, table, event)

        if method == "GET" and query.get("postId"):
            return handle_get_one(query["postId"], table, event)

        if method == "GET" and not post_id:
            return handle_list(event, table)

        if method == "PATCH":
            patch_post_id = post_id
            if not patch_post_id:
                body = parse_body(event) or {}
                patch_post_id = body.get("postId") or body.get("id")
            if patch_post_id:
                return handle_patch(patch_post_id, event, table)

        return response(405, {"error": "Method not allowed", "path": path, "method": method})
    except ClientError as e:
        print(e)
        return response(500, {"error": "DynamoDB error", "message": str(e)})
    except Exception as e:
        print(e)
        return response(500, {"error": "Internal error", "message": str(e)})
