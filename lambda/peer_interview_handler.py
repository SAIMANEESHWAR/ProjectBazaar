"""
Peer Interview API — AWS Lambda (Python 3.11+)

DynamoDB single table, NO Global Secondary Indexes (only pk + sk).
  - pk / sk are the only keys; all access is Query/GetItem on those keys or Scan for public browse.


Primary / sort keys (table-wide)
  - Partition key attribute name: pk (String)
  - Sort key attribute name: sk (String)
  They are NOT only “your userId”. One table stores several entity shapes; userId appears
  inside pk (e.g. OWNER#<userId>) and as attributes ownerUserId / fromUserId.
  For photos and rich profile fields, store denormalized avatarUrl/displayName on the listing,
  and/or load the Users API by ownerUserId.

Entity layout
  1) Listing (your scheduled peer post)
       pk = OWNER#<ownerUserId>
       sk = LISTING#<listingId>
       entityType = LISTING
  2) Connection (someone asked to practice on your listing)
       pk = LISTING#<listingId>
       sk = CONN#<connectionId>
       entityType = CONNECTION
  3) Outbound pointer (for “requests I sent” — duplicate metadata, no GSI)
       pk = FROMUSER#<fromUserId>
       sk = OUTBOUND#<listingId>#<connectionId>
       entityType = OUTBOUND

Environment
  PEER_INTERVIEW_TABLE  — must match your DynamoDB table name exactly (e.g. PEER_INTERVIEW_TABLE or PeerInterview).
  Default below is PEER_INTERVIEW_TABLE to match a table created with that literal name.

HTTP API (API Gateway HTTP API v2) — supports rawPath or path + httpMethod.
Also accepts legacy JSON { "action": "...", ... } on POST body for flexibility.

Methods used: GET, POST, PUT, PATCH, DELETE, OPTIONS
"""

from __future__ import annotations

import base64
import json
import os
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Callable, Dict, List, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

TABLE_NAME = os.environ.get("PEER_INTERVIEW_TABLE", "PEER_INTERVIEW_TABLE")

_dynamodb = boto3.resource("dynamodb")
_table = _dynamodb.Table(TABLE_NAME)

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-user-id,X-User-Id",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
}


def response(status_code: int, body: Any) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def get_http_method(event: Dict[str, Any]) -> str:
    ctx = event.get("requestContext") or {}
    http = ctx.get("http") or {}
    return (http.get("method") or event.get("httpMethod") or "GET").upper()


def parse_body(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    raw = event.get("body")
    if not raw:
        return {}
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    try:
        return json.loads(raw) if isinstance(raw, str) else raw
    except (json.JSONDecodeError, TypeError, ValueError):
        return None


def merge_query_into_body(event: Dict[str, Any], body: Dict[str, Any]) -> Dict[str, Any]:
    q = event.get("queryStringParameters") or {}
    merged = {**body}
    for k, v in q.items():
        if v is not None and k not in merged:
            merged[k] = v
    return merged


def normalize_path(event: Dict[str, Any]) -> List[str]:
    raw = event.get("rawPath") or event.get("path") or "/"
    raw = raw.split("?")[0]
    parts = [p for p in raw.strip("/").split("/") if p]
    # drop common stage / function name segments if present
    while parts and parts[0] in ("default", "prod", "dev", "peer-interview", "peer_interview"):
        parts = parts[1:]
    return parts


def to_jsonable(value: Any) -> Any:
    if isinstance(value, list):
        return [to_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: to_jsonable(v) for k, v in value.items()}
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    return value


def strip_keys(item: Dict[str, Any]) -> Dict[str, Any]:
    """Remove DynamoDB internal keys for API responses."""
    out = dict(item)
    out.pop("pk", None)
    out.pop("sk", None)
    return to_jsonable(out)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def meet_link_placeholder(seed: str) -> str:
    compact = re.sub(r"[^a-z0-9]", "", (seed or "session").lower())[:12] or "session"
    a, b, c = compact[:3], compact[3:7], compact[7:11]
    return f"https://meet.google.com/{a}-{b}-{c or 'zzz'}"


def require_user_id(event: Dict[str, Any], body: Dict[str, Any]) -> Optional[str]:
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    uid = headers.get("x-user-id") or body.get("userId") or body.get("viewerUserId")
    if uid is None:
        return None
    s = str(uid).strip()
    return s or None


# ----- Listing CRUD -----


def handle_create_listing(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    owner = str(body.get("ownerUserId") or viewer).strip()
    if owner != viewer:
        return response(403, {"success": False, "error": "ownerUserId must match caller"})

    listing_id = str(body.get("listingId") or uuid.uuid4())
    item = {
        "pk": f"OWNER#{owner}",
        "sk": f"LISTING#{listing_id}",
        "entityType": "LISTING",
        "listingId": listing_id,
        "ownerUserId": owner,
        "displayName": body.get("displayName"),
        "practiceGoal": body.get("practiceGoal") or body.get("headline"),
        "category": body.get("category"),
        "skills": body.get("skills"),
        "experienceLevel": body.get("experienceLevel"),
        "timezoneRegion": body.get("timezoneRegion"),
        "practiceMode": body.get("practiceMode", "peers"),
        "roleTitle": body.get("roleTitle"),
        "orgOrContext": body.get("orgOrContext"),
        "techTags": body.get("techTags") or [],
        "availabilityWindows": body.get("availabilityWindows") or [],
        "queueIntent": body.get("queueIntent"),
        "bio": body.get("bio"),
        "avatarUrl": body.get("avatarUrl"),
        "isPublic": body.get("isPublic", True),
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    item = {k: v for k, v in item.items() if v is not None}
    try:
        # Composite key: only sk must be unused for this partition (same owner has many LISTING#*).
        _table.put_item(Item=item, ConditionExpression="attribute_not_exists(sk)")
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return response(409, {"success": False, "error": "listing already exists"})
        return response(500, {"success": False, "error": str(e)})
    return response(201, {"success": True, "data": strip_keys(item)})


def _scan_all_with_filter(
    filter_expression: str,
    expression_values: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """Paginated Scan; keeps FilterExpression on every page."""
    scan_kw: Dict[str, Any] = {
        "FilterExpression": filter_expression,
        "ExpressionAttributeValues": expression_values,
    }
    out: List[Dict[str, Any]] = []
    scan = _table.scan(**scan_kw)
    out.extend(scan.get("Items", []))
    while "LastEvaluatedKey" in scan:
        scan = _table.scan(ExclusiveStartKey=scan["LastEvaluatedKey"], **scan_kw)
        out.extend(scan.get("Items", []))
    return out


def handle_get_listing(listing_id: str) -> Dict[str, Any]:
    try:
        items = _scan_all_with_filter(
            "listingId = :lid AND entityType = :et",
            {":lid": listing_id, ":et": "LISTING"},
        )
        if not items:
            return response(404, {"success": False, "error": "listing not found"})
        return response(200, {"success": True, "data": strip_keys(items[0])})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})


def handle_list_mine(owner: str) -> Dict[str, Any]:
    try:
        q = _table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :prefix)",
            ExpressionAttributeValues={":pk": f"OWNER#{owner}", ":prefix": "LISTING#"},
        )
        rows = [strip_keys(i) for i in q.get("Items", [])]
        return response(200, {"success": True, "data": rows})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})


def handle_list_public(body: Dict[str, Any]) -> Dict[str, Any]:
    """Scan public peer listings (no index). Optional filters: category, practiceMode."""
    category = body.get("category")
    practice_mode = body.get("practiceMode", "peers")
    try:
        items = _scan_all_with_filter("entityType = :et", {":et": "LISTING"})
        out = []
        for it in items:
            if not it.get("isPublic", True):
                continue
            if practice_mode and it.get("practiceMode") != practice_mode:
                continue
            if category and str(it.get("category", "")) != str(category):
                continue
            out.append(strip_keys(it))
        return response(200, {"success": True, "data": out})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})


def handle_update_listing(listing_id: str, body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    listing, owner_pk = _find_listing_and_pk(listing_id)
    if not listing:
        return response(404, {"success": False, "error": "listing not found"})
    if listing.get("ownerUserId") != viewer:
        return response(403, {"success": False, "error": "not owner"})

    allowed = [
        "displayName",
        "practiceGoal",
        "category",
        "skills",
        "experienceLevel",
        "timezoneRegion",
        "practiceMode",
        "roleTitle",
        "orgOrContext",
        "techTags",
        "availabilityWindows",
        "queueIntent",
        "bio",
        "avatarUrl",
        "isPublic",
    ]
    updates = {k: body[k] for k in allowed if k in body}
    if not updates:
        return response(400, {"success": False, "error": "no updatable fields"})

    expr_names: Dict[str, str] = {}
    expr_vals: Dict[str, Any] = {":u": now_iso()}
    parts = ["updatedAt = :u"]
    for idx, (k, v) in enumerate(updates.items()):
        nk = f"#k{idx}"
        vk = f":v{idx}"
        expr_names[nk] = k
        expr_vals[vk] = v
        parts.append(f"{nk} = {vk}")

    try:
        _table.update_item(
            Key={"pk": listing["pk"], "sk": listing["sk"]},
            UpdateExpression="SET " + ", ".join(parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_vals,
            ReturnValues="ALL_NEW",
        )
        refreshed = _table.get_item(Key={"pk": listing["pk"], "sk": listing["sk"]}).get("Item")
        return response(200, {"success": True, "data": strip_keys(refreshed or {})})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})


def handle_delete_listing(listing_id: str, viewer: str) -> Dict[str, Any]:
    listing, _ = _find_listing_and_pk(listing_id)
    if not listing:
        return response(404, {"success": False, "error": "listing not found"})
    if listing.get("ownerUserId") != viewer:
        return response(403, {"success": False, "error": "not owner"})
    try:
        # delete connections under LISTING#id
        conns = _table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :p)",
            ExpressionAttributeValues={":pk": f"LISTING#{listing_id}", ":p": "CONN#"},
        ).get("Items", [])
        for c in conns:
            _table.delete_item(Key={"pk": c["pk"], "sk": c["sk"]})
            # remove outbound pointer if exists
            fid = c.get("fromUserId")
            cid = c.get("connectionId")
            if fid and cid:
                _table.delete_item(
                    Key={"pk": f"FROMUSER#{fid}", "sk": f"OUTBOUND#{listing_id}#{cid}"}
                )
        _table.delete_item(Key={"pk": listing["pk"], "sk": listing["sk"]})
        return response(200, {"success": True, "data": {"deletedListingId": listing_id}})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})


def _find_listing_and_pk(listing_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    items = _scan_all_with_filter(
        "listingId = :lid AND entityType = :et",
        {":lid": listing_id, ":et": "LISTING"},
    )
    if items:
        it = items[0]
        return it, it.get("pk")
    return None, None


# ----- Connections -----


def handle_create_connection(listing_id: str, body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    listing, _ = _find_listing_and_pk(listing_id)
    if not listing:
        return response(404, {"success": False, "error": "listing not found"})
    if not listing.get("isPublic", True):
        return response(409, {"success": False, "error": "listing is closed for new connections"})
    try:
        existing = _table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :p)",
            ExpressionAttributeValues={":pk": f"LISTING#{listing_id}", ":p": "CONN#"},
        ).get("Items", [])
        if any(str(i.get("status") or "").lower() == "accepted" for i in existing):
            return response(409, {"success": False, "error": "listing already has an accepted member"})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})
    owner = listing.get("ownerUserId")
    if owner == viewer:
        return response(400, {"success": False, "error": "cannot connect to own listing"})

    from_name = (body.get("fromName") or "").strip() or "Peer"
    slots = body.get("slots") or []
    if not isinstance(slots, list):
        slots = [str(slots)]
    conn_id = str(body.get("connectionId") or uuid.uuid4())
    ts = now_iso()
    conn_item = {
        "pk": f"LISTING#{listing_id}",
        "sk": f"CONN#{conn_id}",
        "entityType": "CONNECTION",
        "listingId": listing_id,
        "connectionId": conn_id,
        "fromUserId": viewer,
        "fromName": from_name,
        "slots": slots,
        "status": "pending",
        "requestedAt": ts,
        "updatedAt": ts,
    }
    outbound = {
        "pk": f"FROMUSER#{viewer}",
        "sk": f"OUTBOUND#{listing_id}#{conn_id}",
        "entityType": "OUTBOUND",
        "listingId": listing_id,
        "connectionId": conn_id,
        "ownerUserId": owner,
        "ownerName": listing.get("displayName"),
        "listingTitle": listing.get("practiceGoal") or listing.get("displayName"),
        "fromUserId": viewer,
        "fromName": from_name,
        "slots": slots,
        "status": "pending",
        "requestedAt": ts,
    }
    try:
        _table.put_item(Item=conn_item, ConditionExpression="attribute_not_exists(sk)")
        _table.put_item(Item=outbound)
        return response(201, {"success": True, "data": strip_keys(conn_item)})
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return response(409, {"success": False, "error": "connection id collision"})
        return response(500, {"success": False, "error": str(e)})


def handle_list_connections(listing_id: str, viewer: str) -> Dict[str, Any]:
    listing, _ = _find_listing_and_pk(listing_id)
    if not listing:
        return response(404, {"success": False, "error": "listing not found"})
    if listing.get("ownerUserId") != viewer:
        return response(403, {"success": False, "error": "only listing owner can list connections"})
    try:
        q = _table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :p)",
            ExpressionAttributeValues={":pk": f"LISTING#{listing_id}", ":p": "CONN#"},
        )
        rows = [strip_keys(i) for i in q.get("Items", [])]
        return response(200, {"success": True, "data": rows})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})


def handle_patch_connection(listing_id: str, conn_id: str, body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    listing, _ = _find_listing_and_pk(listing_id)
    if not listing:
        return response(404, {"success": False, "error": "listing not found"})
    if listing.get("ownerUserId") != viewer:
        return response(403, {"success": False, "error": "only owner can accept/reject"})

    key = {"pk": f"LISTING#{listing_id}", "sk": f"CONN#{conn_id}"}
    cur = _table.get_item(Key=key).get("Item")
    if not cur:
        return response(404, {"success": False, "error": "connection not found"})

    op = str(body.get("status") or body.get("action") or "").lower()
    if op in ("accept", "accepted"):
        new_status = "accepted"
        meet = body.get("meetLink") or meet_link_placeholder(f"{listing_id}-{conn_id}")
    elif op in ("reject", "rejected"):
        new_status = "rejected"
        meet = None
    elif op in ("cancel", "cancelled") and cur.get("fromUserId") == viewer:
        new_status = "cancelled"
        meet = cur.get("meetLink")
    else:
        return response(
            400,
            {"success": False, "error": "set status to accept|reject or cancel (requester only)"},
        )

    ts = now_iso()
    update_parts = ["#st = :st", "updatedAt = :u"]
    expr_vals: Dict[str, Any] = {":st": new_status, ":u": ts}
    expr_names = {"#st": "status"}
    if new_status == "accepted" and meet:
        update_parts.append("meetLink = :ml")
        expr_vals[":ml"] = meet
    try:
        _table.update_item(
            Key=key,
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeNames=expr_names,
            ExpressionAttributeValues=expr_vals,
            ReturnValues="ALL_NEW",
        )
        out_item = _table.get_item(Key=key).get("Item") or {}
        fid = out_item.get("fromUserId")
        if fid:
            ob_key = {"pk": f"FROMUSER#{fid}", "sk": f"OUTBOUND#{listing_id}#{conn_id}"}
            try:
                if new_status == "accepted" and meet:
                    _table.update_item(
                        Key=ob_key,
                        UpdateExpression="SET #st = :st, updatedAt = :u, meetLink = :ml",
                        ExpressionAttributeNames={"#st": "status"},
                        ExpressionAttributeValues={":st": new_status, ":u": ts, ":ml": meet},
                    )
                else:
                    _table.update_item(
                        Key=ob_key,
                        UpdateExpression="SET #st = :st, updatedAt = :u",
                        ExpressionAttributeNames={"#st": "status"},
                        ExpressionAttributeValues={":st": new_status, ":u": ts},
                    )
            except ClientError:
                pass
        # Enforce one accepted member per listing: once one is accepted, auto-reject the rest.
        if new_status == "accepted":
            try:
                others = _table.query(
                    KeyConditionExpression="pk = :pk AND begins_with(sk, :p)",
                    ExpressionAttributeValues={":pk": f"LISTING#{listing_id}", ":p": "CONN#"},
                ).get("Items", [])
                for other in others:
                    other_cid = str(other.get("connectionId") or "")
                    if not other_cid or other_cid == conn_id:
                        continue
                    other_status = str(other.get("status") or "").lower()
                    if other_status != "pending":
                        continue
                    other_key = {"pk": f"LISTING#{listing_id}", "sk": f"CONN#{other_cid}"}
                    _table.update_item(
                        Key=other_key,
                        UpdateExpression="SET #st = :st, updatedAt = :u",
                        ExpressionAttributeNames={"#st": "status"},
                        ExpressionAttributeValues={":st": "rejected", ":u": ts},
                    )
                    other_fid = other.get("fromUserId")
                    if other_fid:
                        try:
                            _table.update_item(
                                Key={"pk": f"FROMUSER#{other_fid}", "sk": f"OUTBOUND#{listing_id}#{other_cid}"},
                                UpdateExpression="SET #st = :st, updatedAt = :u",
                                ExpressionAttributeNames={"#st": "status"},
                                ExpressionAttributeValues={":st": "rejected", ":u": ts},
                            )
                        except ClientError:
                            pass
            except ClientError:
                pass
            # Hide listing from public queue after a successful match.
            try:
                _table.update_item(
                    Key={"pk": listing["pk"], "sk": listing["sk"]},
                    UpdateExpression="SET isPublic = :p, updatedAt = :u",
                    ExpressionAttributeValues={":p": False, ":u": ts},
                )
            except ClientError:
                pass
        return response(200, {"success": True, "data": strip_keys(out_item)})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})


def handle_my_outgoing(viewer: str) -> Dict[str, Any]:
    try:
        q = _table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :p)",
            ExpressionAttributeValues={":pk": f"FROMUSER#{viewer}", ":p": "OUTBOUND#"},
        )
        return response(200, {"success": True, "data": [strip_keys(i) for i in q.get("Items", [])]})
    except ClientError as e:
        return response(500, {"success": False, "error": str(e)})


def handle_my_incoming(viewer: str) -> Dict[str, Any]:
    """All connection rows on listings owned by viewer."""
    mine = handle_list_mine(viewer)
    if mine["statusCode"] != 200:
        return mine
    body = json.loads(mine["body"])
    listings = body.get("data") or []
    aggregated: List[Dict[str, Any]] = []
    for L in listings:
        lid = L.get("listingId")
        if not lid:
            continue
        q = _table.query(
            KeyConditionExpression="pk = :pk AND begins_with(sk, :p)",
            ExpressionAttributeValues={":pk": f"LISTING#{lid}", ":p": "CONN#"},
        )
        for row in q.get("Items", []):
            r = strip_keys(row)
            r["listingTitle"] = L.get("practiceGoal") or L.get("displayName")
            aggregated.append(r)
    aggregated.sort(key=lambda x: x.get("requestedAt") or "", reverse=True)
    return response(200, {"success": True, "data": aggregated})


# ----- Legacy action router (POST body.action) -----

ACTION_HANDLERS: Dict[str, Callable[[Dict[str, Any], str], Dict[str, Any]]] = {}


def register_action(name: str, fn: Callable[[Dict[str, Any], str], Dict[str, Any]]) -> None:
    ACTION_HANDLERS[name.upper()] = fn


def action_dispatch(body: Dict[str, Any], viewer: str) -> Optional[Dict[str, Any]]:
    act = str(body.get("action") or "").upper()
    if not act:
        return None
    fn = ACTION_HANDLERS.get(act)
    if not fn:
        return response(
            400,
            {
                "success": False,
                "error": f"Unknown action {act}",
                "supported": sorted(ACTION_HANDLERS.keys()),
            },
        )
    return fn(body, viewer)


def _act_create_listing(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    return handle_create_listing(body, viewer)


def _act_list_mine(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    return handle_list_mine(viewer)


def _act_list_public(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    return handle_list_public(body)


def _act_get_listing(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    lid = body.get("listingId")
    if not lid:
        return response(400, {"success": False, "error": "listingId required"})
    return handle_get_listing(str(lid))


def _act_update_listing(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    lid = body.get("listingId")
    if not lid:
        return response(400, {"success": False, "error": "listingId required"})
    return handle_update_listing(str(lid), body, viewer)


def _act_delete_listing(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    lid = body.get("listingId")
    if not lid:
        return response(400, {"success": False, "error": "listingId required"})
    return handle_delete_listing(str(lid), viewer)


def _act_create_connection(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    lid = body.get("listingId")
    if not lid:
        return response(400, {"success": False, "error": "listingId required"})
    return handle_create_connection(str(lid), body, viewer)


def _act_list_connections(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    lid = body.get("listingId")
    if not lid:
        return response(400, {"success": False, "error": "listingId required"})
    return handle_list_connections(str(lid), viewer)


def _act_patch_connection(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    lid = body.get("listingId")
    cid = body.get("connectionId")
    if not lid or not cid:
        return response(400, {"success": False, "error": "listingId and connectionId required"})
    return handle_patch_connection(str(lid), str(cid), body, viewer)


def _act_my_outgoing(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    return handle_my_outgoing(viewer)


def _act_my_incoming(body: Dict[str, Any], viewer: str) -> Dict[str, Any]:
    return handle_my_incoming(viewer)


def _register_all_actions() -> None:
    register_action("CREATE_LISTING", _act_create_listing)
    register_action("GET_LISTING", _act_get_listing)
    register_action("LIST_MY_LISTINGS", _act_list_mine)
    register_action("LIST_PUBLIC_LISTINGS", _act_list_public)
    register_action("UPDATE_LISTING", _act_update_listing)
    register_action("DELETE_LISTING", _act_delete_listing)
    register_action("CREATE_CONNECTION", _act_create_connection)
    register_action("LIST_CONNECTIONS", _act_list_connections)
    register_action("UPDATE_CONNECTION", _act_patch_connection)
    register_action("MY_OUTGOING_REQUESTS", _act_my_outgoing)
    register_action("MY_INCOMING_REQUESTS", _act_my_incoming)


_register_all_actions()


def route_rest(method: str, parts: List[str], body: Dict[str, Any], viewer: str) -> Optional[Dict[str, Any]]:
    """REST-style paths: listings/mine, listings/public, listings/{id}, ..."""
    if not parts:
        return None
    p = [x.lower() for x in parts]

    if p[0] == "listings" and len(p) == 2 and p[1] == "mine" and method == "GET":
        return handle_list_mine(viewer)
    if p[0] == "listings" and len(p) == 2 and p[1] == "public" and method == "GET":
        return handle_list_public(body)
    if p[0] == "listings" and len(p) == 1 and method == "POST":
        return handle_create_listing(body, viewer)
    if p[0] == "listings" and len(p) == 2 and method == "GET":
        return handle_get_listing(parts[1])
    if p[0] == "listings" and len(p) == 2 and method == "PUT":
        return handle_update_listing(parts[1], body, viewer)
    if p[0] == "listings" and len(p) == 2 and method == "PATCH":
        return handle_update_listing(parts[1], body, viewer)
    if p[0] == "listings" and len(p) == 2 and method == "DELETE":
        return handle_delete_listing(parts[1], viewer)

    # listings/{listingId}/connections or .../connections/{connectionId}
    if p[0] == "listings" and len(p) == 3 and p[2] == "connections" and method == "POST":
        return handle_create_connection(parts[1], body, viewer)
    if p[0] == "listings" and len(p) == 3 and p[2] == "connections" and method == "GET":
        return handle_list_connections(parts[1], viewer)
    if p[0] == "listings" and len(p) == 4 and p[2] == "connections" and method == "PATCH":
        return handle_patch_connection(parts[1], parts[3], body, viewer)
    if p[0] == "listings" and len(p) == 4 and p[2] == "connections" and method == "PUT":
        return handle_patch_connection(parts[1], parts[3], body, viewer)

    if p[0] == "me" and len(p) == 2 and p[1] == "outgoing" and method == "GET":
        return handle_my_outgoing(viewer)
    if p[0] == "me" and len(p) == 2 and p[1] == "incoming" and method == "GET":
        return handle_my_incoming(viewer)

    return None


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = get_http_method(event)
    if method == "OPTIONS":
        return response(200, {"ok": True})

    body = parse_body(event)
    if body is None:
        return response(400, {"success": False, "error": "Invalid JSON body"})
    body = merge_query_into_body(event, body)

    viewer = require_user_id(event, body)
    if not viewer:
        return response(401, {"success": False, "error": "x-user-id header or userId in body required"})

    parts = normalize_path(event)

    # REST first
    rest = route_rest(method, parts, body, viewer)
    if rest is not None:
        return rest

    # Body action (POST/GET with action)
    if method in ("POST", "GET", "PUT", "PATCH", "DELETE"):
        ad = action_dispatch(body, viewer)
        if ad is not None:
            return ad

    return response(
        400,
        {
            "success": False,
            "error": "No matching route or action",
            "hint": {
                "paths": [
                    "GET listings/mine",
                    "GET listings/public",
                    "POST listings",
                    "GET|PUT|PATCH|DELETE listings/{listingId}",
                    "POST|GET listings/{listingId}/connections",
                    "PATCH listings/{listingId}/connections/{connectionId}",
                    "GET me/outgoing",
                    "GET me/incoming",
                ],
                "actions": sorted(ACTION_HANDLERS.keys()),
            },
        },
    )
