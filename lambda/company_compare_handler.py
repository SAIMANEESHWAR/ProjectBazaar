"""
Company Compare API — DynamoDB + HTTP API (Python 3.12)

Table: PK companyId. GSI ByStream lists all companies sorted by name.

Env: COMPARE_TABLE_NAME, STAGE, ADMIN_SYNC_KEY

All routes use POST to the Lambda URL (or /companies when behind HTTP API).

Public:
  POST { "action": "list", ...filters }           — list with filters
  POST { "action": "get", "companyId": "..." }    — get one

Admin (header x-admin-key must match ADMIN_SYNC_KEY):
  POST { "action": "admin_sync", "companies": [...] }     — full replace
  POST { "action": "admin_upsert", "company": {...} }      — upsert one
  POST { "action": "admin_delete", "companyId": "..." }   — delete one

SAM: lambda/company-compare/template.yaml, Handler company_compare_handler.lambda_handler
"""

import base64
import json
import os
import re
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-admin-key",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}

STAGE = os.environ.get("STAGE", "dev")
STREAM_PARTITION = "COMPARE"
STREAM_INDEX = "ByStream"
DEFAULT_TABLE_NAME = "company-compare-dev-companies"

_dynamodb = None
_table = None


def _get_table():
    global _dynamodb, _table
    name = (os.environ.get("COMPARE_TABLE_NAME") or DEFAULT_TABLE_NAME).strip()
    if not name:
        return None
    if _table is None:
        _dynamodb = boto3.resource("dynamodb")
        _table = _dynamodb.Table(name)
    return _table


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=_json_default),
    }


def _json_default(obj):
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


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


def parse_list_query(source):
    q = source or {}
    lim = int(q.get("limit") or 100)
    lim = max(1, min(500, lim))
    min_rating = q.get("minRating")
    try:
        min_rating = float(min_rating) if min_rating not in (None, "") else None
    except (TypeError, ValueError):
        min_rating = None
    return {
        "search": (q.get("search") or "").strip(),
        "industry": (q.get("industry") or "").strip() or None,
        "location": (q.get("location") or "").strip() or None,
        "role": (q.get("role") or "").strip() or None,
        "minRating": min_rating,
        "limit": lim,
        "nextToken": q.get("nextToken"),
    }


def parse_query(event):
    q = event.get("queryStringParameters") or {}
    return parse_list_query(q)


def decode_next_token(token):
    if not token:
        return 0
    try:
        pad = "=" * (-len(token) % 4)
        blob = base64.urlsafe_b64decode(token + pad)
        data = json.loads(blob.decode("utf-8"))
        return int(data.get("offset", 0))
    except (json.JSONDecodeError, ValueError, TypeError):
        return 0


def encode_next_token(offset):
    if offset is None or offset <= 0:
        return None
    raw = json.dumps({"offset": offset}, separators=(",", ":"))
    return base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii").rstrip("=")


def strip_citations(obj):
    if isinstance(obj, list):
        return [strip_citations(x) for x in obj]
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k.endswith("_citation"):
                continue
            out[k] = strip_citations(v)
        return out
    return obj


def slugify_name(name):
    if not name:
        return "unknown"
    return re.sub(r"(^-+|-+$)", "", re.sub(r"[^a-z0-9]+", "-", name.strip().lower()))


def _clean_headquarters(hq):
    if not hq:
        return ""
    text = str(hq)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text.strip()


def _coerce_float(val, default=0.0):
    if val is None:
        return default
    if isinstance(val, Decimal):
        return float(val)
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _extract_value(item):
    if isinstance(item, str):
        return item
    if isinstance(item, dict):
        return item.get("value") or item.get("name") or item.get("role") or ""
    return str(item) if item is not None else ""


def _build_ratings(raw_ratings):
    raw_ratings = raw_ratings or {}
    salary_benefits = _coerce_float(raw_ratings.get("salary_and_benefits"))
    management = _coerce_float(raw_ratings.get("management"))
    if not management and salary_benefits:
        management = salary_benefits
    return {
        "overall_rating": _coerce_float(raw_ratings.get("overall_rating")),
        "work_life_balance": _coerce_float(raw_ratings.get("work_life_balance")),
        "company_culture": _coerce_float(raw_ratings.get("company_culture")),
        "skill_development": _coerce_float(raw_ratings.get("skill_development")),
        "job_security": _coerce_float(raw_ratings.get("job_security")),
        "management": management,
        "salary_and_benefits": salary_benefits or management,
    }


def _build_synthetic_salary(salary_range, company_name):
    if not salary_range:
        return []
    return [
        {
            "role": "Average role",
            "average_annual_salary": salary_range,
            "salary_range": salary_range,
            "experience_level": "",
        }
    ]


def _build_interviews_from_questions(questions, company_name):
    qs = []
    for q in questions or []:
        val = _extract_value(q)
        if val:
            qs.append({"value": val})
    if not qs:
        return []
    return [
        {
            "role": "General",
            "difficulty_level": "Moderate",
            "experience_summary": f"Common interview questions at {company_name}",
            "interview_questions": qs,
        }
    ]


def _build_active_jobs(roles, headquarters):
    jobs = []
    loc = _clean_headquarters(headquarters) or "India"
    for role in roles or []:
        title = _extract_value(role)
        if not title:
            continue
        jobs.append(
            {
                "job_title": title,
                "location": loc,
                "posted_date": "",
                "apply_url": "",
            }
        )
    return jobs


def _build_benefits(raw_benefits):
    out = []
    for b in raw_benefits or []:
        val = _extract_value(b)
        if val:
            out.append({"value": val})
    return out


def normalize_company_raw(raw, now=None, existing_created_at=None):
    """Normalize new or legacy upload shape into canonical DynamoDB item."""
    cleaned = strip_citations(raw if isinstance(raw, dict) else {})

    if cleaned.get("companyId") and cleaned.get("identity"):
        identity = cleaned.get("identity") or {}
        name = identity.get("name") or cleaned.get("name") or "Unknown"
        company_id = cleaned.get("companyId") or slugify_name(name)
        ratings = cleaned.get("ratings") or {}
        if isinstance(ratings, dict):
            ratings = _build_ratings(ratings)
        ts = now or now_iso()
        return {
            "companyId": company_id,
            "streamPartition": STREAM_PARTITION,
            "name": name,
            "logoUrl": cleaned.get("logoUrl") or "",
            "identity": {
                "name": name,
                "description": identity.get("description") or "",
                "industry": identity.get("industry") or "",
                "headquarters": _clean_headquarters(identity.get("headquarters")),
                "website": identity.get("website") or "",
            },
            "foundedYear": cleaned.get("foundedYear"),
            "employeeCount": cleaned.get("employeeCount") or "",
            "overviewUrl": cleaned.get("overviewUrl") or "",
            "ratings": ratings,
            "salaryRange": cleaned.get("salaryRange") or "",
            "salaries": cleaned.get("salaries") or [],
            "interviews": cleaned.get("interviews") or [],
            "benefits": cleaned.get("benefits") or [],
            "reviews": cleaned.get("reviews") or [],
            "active_jobs": cleaned.get("active_jobs") or [],
            "interviewQuestions": cleaned.get("interviewQuestions") or [],
            "metadata": cleaned.get("metadata") or {"source_urls": [], "scrape_timestamp": ts},
            "createdAt": existing_created_at or cleaned.get("createdAt") or ts,
            "updatedAt": ts,
        }

    profile = cleaned.get("ambitionbox_profile") or cleaned.get("company_identity") or {}
    ratings_raw = cleaned.get("employee_ratings") or cleaned.get("ambitionbox_ratings") or {}
    name = profile.get("name") or "Unknown"
    company_id = slugify_name(name)
    hq = _clean_headquarters(profile.get("headquarters"))
    overview_url = raw.get("ambitionbox_profile", {}).get("name_citation") if isinstance(raw, dict) else ""
    if not overview_url:
        overview_url = profile.get("name_citation") or ""

    salary_data = cleaned.get("salary_data") or {}
    salary_range = salary_data.get("salary_range") or ""
    salaries = cleaned.get("salaries") or []
    if not salaries and salary_range:
        salaries = _build_synthetic_salary(salary_range, name)

    interview_insights = cleaned.get("interview_insights") or {}
    questions = interview_insights.get("common_interview_questions") or []
    interviews = cleaned.get("interviews") or []
    if not interviews and questions:
        interviews = _build_interviews_from_questions(questions, name)

    jobs_hiring = cleaned.get("jobs_and_hiring") or {}
    hiring_roles = jobs_hiring.get("top_hiring_roles") or []
    active_jobs = cleaned.get("active_jobs") or []
    if not active_jobs and hiring_roles:
        active_jobs = _build_active_jobs(hiring_roles, hq)

    benefits = cleaned.get("benefits") or _build_benefits(cleaned.get("major_benefits"))
    metadata = cleaned.get("metadata") or {
        "source_urls": [{"value": overview_url}] if overview_url else [],
        "scrape_timestamp": now or now_iso(),
    }

    interview_questions = [_extract_value(q) for q in questions if _extract_value(q)]

    ts = now or now_iso()
    return {
        "companyId": company_id,
        "streamPartition": STREAM_PARTITION,
        "name": name,
        "logoUrl": profile.get("logo_url") or "",
        "identity": {
            "name": name,
            "description": profile.get("description") or "",
            "industry": profile.get("industry") or "",
            "headquarters": hq,
            "website": profile.get("website") or "",
        },
        "foundedYear": profile.get("founded_year"),
        "employeeCount": profile.get("employee_count") or "",
        "overviewUrl": overview_url,
        "ratings": _build_ratings(ratings_raw),
        "salaryRange": salary_range,
        "salaries": salaries,
        "interviews": interviews,
        "benefits": benefits,
        "reviews": cleaned.get("reviews") or [],
        "active_jobs": active_jobs,
        "interviewQuestions": interview_questions,
        "metadata": metadata,
        "createdAt": existing_created_at or ts,
        "updatedAt": ts,
    }


def _to_public_company(item):
    if not item:
        return None
    ratings = item.get("ratings") or {}
    return {
        "companyId": item.get("companyId"),
        "id": item.get("companyId"),
        "name": item.get("name"),
        "logoUrl": item.get("logoUrl") or "",
        "identity": item.get("identity") or {},
        "foundedYear": item.get("foundedYear"),
        "employeeCount": item.get("employeeCount") or "",
        "overviewUrl": item.get("overviewUrl") or "",
        "ratings": ratings,
        "salaryRange": item.get("salaryRange") or "",
        "salaries": item.get("salaries") or [],
        "interviews": item.get("interviews") or [],
        "benefits": item.get("benefits") or [],
        "reviews": item.get("reviews") or [],
        "active_jobs": item.get("active_jobs") or [],
        "interviewQuestions": item.get("interviewQuestions") or [],
        "metadata": item.get("metadata") or {"source_urls": [], "scrape_timestamp": ""},
        "createdAt": item.get("createdAt"),
        "updatedAt": item.get("updatedAt"),
    }


def _matches_filters(company, query):
    industry = query.get("industry")
    if industry and (company.get("identity") or {}).get("industry") != industry:
        return False

    min_rating = query.get("minRating")
    if min_rating is not None:
        overall = _coerce_float((company.get("ratings") or {}).get("overall_rating"))
        if overall < min_rating:
            return False

    location = query.get("location")
    if location:
        needle = location.lower()
        identity = company.get("identity") or {}
        haystack = " ".join(
            [
                identity.get("headquarters") or "",
                " ".join(j.get("location") or "" for j in company.get("active_jobs") or []),
            ]
        ).lower()
        if needle not in haystack:
            return False

    role = query.get("role")
    if role:
        needle = role.lower()
        haystack = " ".join(
            [s.get("role") or "" for s in company.get("salaries") or []]
            + [j.get("job_title") or "" for j in company.get("active_jobs") or []]
        ).lower()
        if needle not in haystack:
            return False

    search = query.get("search")
    if search:
        needle = search.lower()
        identity = company.get("identity") or {}
        haystack = " ".join(
            [
                identity.get("name") or "",
                identity.get("industry") or "",
                identity.get("headquarters") or "",
                identity.get("description") or "",
                " ".join(s.get("role") or "" for s in company.get("salaries") or []),
                " ".join(j.get("job_title") or "" for j in company.get("active_jobs") or []),
            ]
        ).lower()
        if needle not in haystack:
            return False

    return True


def _load_all_companies(table):
    items = []
    kwargs = {
        "IndexName": STREAM_INDEX,
        "KeyConditionExpression": Key("streamPartition").eq(STREAM_PARTITION),
    }
    while True:
        res = table.query(**kwargs)
        items.extend(res.get("Items") or [])
        if not res.get("LastEvaluatedKey"):
            break
        kwargs["ExclusiveStartKey"] = res["LastEvaluatedKey"]
    items.sort(key=lambda x: (x.get("name") or "").lower())
    return items


def handle_list(table, query):
    all_items = _load_all_companies(table)
    filtered = [_to_public_company(c) for c in all_items if _matches_filters(c, query)]

    offset = decode_next_token(query.get("nextToken"))
    limit = query.get("limit") or 100
    page = filtered[offset : offset + limit]
    next_offset = offset + limit
    next_token = encode_next_token(next_offset) if next_offset < len(filtered) else None

    return response(
        200,
        {
            "companies": page,
            "count": len(page),
            "totalMatched": len(filtered),
            "nextToken": next_token,
        },
    )


def handle_get_one(company_id, table):
    res = table.get_item(Key={"companyId": company_id})
    item = res.get("Item")
    if not item:
        return response(404, {"error": "Company not found", "companyId": company_id})
    return response(200, {"company": _to_public_company(item)})


def _check_admin(event):
    expected = (os.environ.get("ADMIN_SYNC_KEY") or "").strip()
    if not expected:
        return response(500, {"error": "ADMIN_SYNC_KEY not configured"})
    provided = (event.get("headers") or {}).get("x-admin-key") or (event.get("headers") or {}).get("X-Admin-Key") or ""
    if provided.strip() != expected:
        return response(401, {"error": "Unauthorized", "message": "Invalid or missing x-admin-key"})
    return None


def handle_admin_sync(body, table, event):
    auth_err = _check_admin(event)
    if auth_err:
        return auth_err

    companies = body.get("companies")
    if not isinstance(companies, list):
        return response(400, {"error": "Body must include companies array"})

    now = now_iso()
    incoming_ids = set()
    written = 0

    existing = _load_all_companies(table)
    existing_by_id = {c["companyId"]: c for c in existing}

    try:
        with table.batch_writer() as batch:
            for raw in companies:
                if not isinstance(raw, dict):
                    continue
                preview = normalize_company_raw(raw, now=now)
                cid = preview["companyId"]
                created_at = (existing_by_id.get(cid) or {}).get("createdAt") or now
                item = normalize_company_raw(raw, now=now, existing_created_at=created_at)
                incoming_ids.add(cid)
                batch.put_item(Item=_decimalize(item))
                written += 1

        stale_ids = [c["companyId"] for c in existing if c["companyId"] not in incoming_ids]
        removed = 0
        if stale_ids:
            with table.batch_writer() as batch:
                for cid in stale_ids:
                    batch.delete_item(Key={"companyId": cid})
                    removed += 1

        return response(
            200,
            {
                "success": True,
                "message": f"Synced {written} companies, removed {removed} stale",
                "count": written,
                "removed": removed,
            },
        )
    except ClientError as e:
        return response(500, {"error": "Database error", "message": str(e)})


def handle_admin_upsert(body, table, event):
    auth_err = _check_admin(event)
    if auth_err:
        return auth_err

    raw = body.get("company")
    if not isinstance(raw, dict):
        return response(400, {"error": "Body must include company object"})

    now = now_iso()
    preview = normalize_company_raw(raw, now=now)
    cid = preview["companyId"]

    existing = table.get_item(Key={"companyId": cid}).get("Item")
    created_at = (existing or {}).get("createdAt") or now
    item = normalize_company_raw(raw, now=now, existing_created_at=created_at)

    try:
        table.put_item(Item=_decimalize(item))
        return response(200, {"success": True, "companyId": cid, "company": _to_public_company(item)})
    except ClientError as e:
        return response(500, {"error": "Database error", "message": str(e)})


def handle_admin_delete(company_id, table, event):
    auth_err = _check_admin(event)
    if auth_err:
        return auth_err

    if not company_id:
        return response(400, {"error": "companyId required"})

    try:
        table.delete_item(Key={"companyId": company_id})
        return response(200, {"success": True, "companyId": company_id})
    except ClientError as e:
        return response(500, {"error": "Database error", "message": str(e)})


def _decimalize(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _decimalize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_decimalize(v) for v in obj]
    return obj


def extract_path_parts(path):
    return [p for p in path.split("/") if p]


def _resolve_post_action(body, parts):
    action = (body.get("action") or "").strip().lower()
    if action:
        return action

    admin_suffix = _admin_companies_suffix(parts)
    if admin_suffix == ["sync"]:
        return "admin_sync"
    if admin_suffix == [] and "admin" in parts:
        return "admin_upsert"
    if admin_suffix and len(admin_suffix) == 1 and "admin" in parts:
        return "admin_delete"

    if body.get("companies") is not None:
        return "admin_sync"
    if body.get("company") is not None:
        return "admin_upsert"
    if body.get("companyId") or body.get("id"):
        return "get"
    return "list"


def _admin_companies_suffix(parts):
    """Path suffix after .../admin/companies (supports API Gateway stage/prefix paths)."""
    if "admin" not in parts or "companies" not in parts:
        return None
    admin_idx = parts.index("admin")
    companies_idx = parts.index("companies")
    if admin_idx >= companies_idx:
        return None
    return parts[companies_idx + 1 :]


def handle_post(body, table, event, parts):
    if body is None:
        return response(400, {"error": "Invalid JSON body"})

    action = _resolve_post_action(body, parts)

    if action == "list":
        return handle_list(table, parse_list_query(body))

    if action == "get":
        company_id = body.get("companyId") or body.get("id")
        if not company_id:
            return response(400, {"error": "companyId required"})
        return handle_get_one(str(company_id), table)

    if action == "admin_sync":
        return handle_admin_sync(body, table, event)

    if action == "admin_upsert":
        return handle_admin_upsert(body, table, event)

    if action == "admin_delete":
        admin_suffix = _admin_companies_suffix(parts)
        company_id = body.get("companyId") or body.get("id") or (admin_suffix[0] if admin_suffix else None)
        if not company_id:
            return response(400, {"error": "companyId required"})
        return handle_admin_delete(str(company_id), table, event)

    return response(400, {"error": "Unknown action", "action": action})


def _is_public_compare_path(parts):
    """Match SAM /companies routes and API Gateway .../company_compare_handler URLs."""
    if not parts:
        return False
    if "companies" in parts:
        return True
    return parts[-1] == "company_compare_handler"


def _resolve_company_id_from_parts(parts):
    if "companies" in parts:
        idx = parts.index("companies")
        if idx + 1 < len(parts):
            return parts[idx + 1]
    return None


def handle_legacy_get(event, table, parts):
    company_id = _resolve_company_id_from_parts(parts)
    if company_id:
        return handle_get_one(company_id, table)
    return handle_list(table, parse_query(event))


def lambda_handler(event, context):
    table = _get_table()
    if table is None:
        return response(500, {"error": "COMPARE_TABLE_NAME not configured"})

    method = get_method(event)
    path = get_path(event)
    parts = extract_path_parts(path)

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    try:
        admin_suffix = _admin_companies_suffix(parts)
        if admin_suffix is not None:
            if method == "POST" and admin_suffix == ["sync"]:
                body = parse_body(event)
                if body is None:
                    return response(400, {"error": "Invalid JSON body"})
                return handle_admin_sync(body, table, event)

            if method == "POST" and admin_suffix == []:
                body = parse_body(event)
                if body is None:
                    return response(400, {"error": "Invalid JSON body"})
                return handle_admin_upsert(body, table, event)

            if method == "DELETE" and len(admin_suffix) == 1:
                return handle_admin_delete(admin_suffix[0], table, event)

            return response(405, {"error": "Method not allowed", "path": path, "method": method})

        if method == "GET" and _is_public_compare_path(parts):
            return handle_legacy_get(event, table, parts)

        if method != "POST":
            return response(405, {"error": "Method not allowed", "path": path, "method": method})

        body = parse_body(event)
        return handle_post(body, table, event, parts)
    except ClientError as e:
        print(e)
        return response(500, {"error": "DynamoDB error", "message": str(e)})
    except Exception as e:
        print(e)
        return response(500, {"error": "Internal error", "message": str(e)})
