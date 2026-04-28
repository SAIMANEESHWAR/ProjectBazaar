"""
Paginated read API for JobListings + optional per-user saved jobs (DynamoDB).

GET query params:
  limit, offset — pagination (default limit 12)
  all=1 — return full sorted list (cap with care)
  userId=<id> — when set, each job includes saved: true/false for that user
  saved_only=1 — only jobs this user saved (requires userId)

POST JSON body:
  { "userId": "<string>", "jobId": "<string>", "save": true | false }
  — create or delete a row in SAVED_JOBS_TABLE

Env:
  JOBS_TABLE (default JobListings)
  SAVED_JOBS_TABLE (default JobHuntSavedJobs) — partition key userId (String), sort key jobId (String)

API Gateway: enable GET, POST, OPTIONS on the same integration (or proxy all to this Lambda).
"""

from __future__ import annotations

import base64
import json
import os
import time
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set

import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ.get("JOBS_TABLE", "JobListings")
SAVED_JOBS_TABLE_NAME = os.environ.get("SAVED_JOBS_TABLE", "JobHuntSavedJobs")
DEFAULT_LIMIT = 12
MAX_LIMIT = 100

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
saved_table = dynamodb.Table(SAVED_JOBS_TABLE_NAME)


def decimal_to_native(obj: Any) -> Any:
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    if isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


def response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
        "body": json.dumps(body, default=decimal_to_native),
    }


def http_method(event: Dict[str, Any]) -> str:
    m = event.get("httpMethod")
    if m:
        return str(m).upper()
    m2 = event.get("requestContext", {}).get("http", {}).get("method")
    if m2:
        return str(m2).upper()
    return "GET"


def parse_json_body(event: Dict[str, Any]) -> Dict[str, Any]:
    raw = event.get("body")
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return raw
    if not isinstance(raw, str):
        return {}
    if event.get("isBase64Encoded"):
        try:
            raw = base64.b64decode(raw).decode("utf-8")
        except Exception:
            return {}
    try:
        out = json.loads(raw or "{}")
        return out if isinstance(out, dict) else {}
    except json.JSONDecodeError:
        return {}


def query_params(event: Dict[str, Any]) -> Dict[str, str]:
    q = event.get("queryStringParameters")
    if not q:
        return {}
    return {str(k): str(v) if v is not None else "" for k, v in q.items()}


def sort_key_item(item: Dict[str, Any]) -> int:
    return int(item.get("scraped_at") or item.get("created_at") or 0)


def job_listing_id(item: Dict[str, Any]) -> str:
    return str(item.get("id") or item.get("PK") or item.get("pk") or "").strip()


def scan_all_job_items() -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    start_key = None
    while True:
        kwargs: Dict[str, Any] = {}
        if start_key:
            kwargs["ExclusiveStartKey"] = start_key
        res = table.scan(**kwargs)
        items.extend(res.get("Items", []))
        start_key = res.get("LastEvaluatedKey")
        if not start_key:
            break
    return items


def fetch_saved_job_ids(user_id: str) -> Set[str]:
    out: Set[str] = set()
    kwargs: Dict[str, Any] = {
        "KeyConditionExpression": Key("userId").eq(user_id),
    }
    while True:
        r = saved_table.query(**kwargs)
        for it in r.get("Items", []):
            jid = it.get("jobId")
            if jid is not None:
                out.add(str(jid))
        lek = r.get("LastEvaluatedKey")
        if not lek:
            break
        kwargs["ExclusiveStartKey"] = lek
    return out


def attach_saved_flags(jobs: List[Dict[str, Any]], saved_ids: Set[str]) -> None:
    for j in jobs:
        jid = job_listing_id(j)
        j["saved"] = bool(jid and jid in saved_ids)


def handle_post(body: Dict[str, Any]) -> Dict[str, Any]:
    user_id = str(body.get("userId") or "").strip()
    job_id = str(body.get("jobId") or "").strip()
    save = body.get("save", True)
    if isinstance(save, str):
        save = save.lower() in {"1", "true", "yes"}

    if not user_id or not job_id:
        return response(400, {"success": False, "error": "userId and jobId are required"})

    if save:
        saved_table.put_item(
            Item={
                "userId": user_id,
                "jobId": job_id,
                "saved_at": int(time.time()),
            }
        )
        return response(200, {"success": True, "saved": True, "userId": user_id, "jobId": job_id})

    saved_table.delete_item(Key={"userId": user_id, "jobId": job_id})
    return response(200, {"success": True, "saved": False, "userId": user_id, "jobId": job_id})


def handle_get(params: Dict[str, str]) -> Dict[str, Any]:
    try:
        limit = int(params.get("limit", DEFAULT_LIMIT))
    except (TypeError, ValueError):
        limit = DEFAULT_LIMIT
    limit = max(1, min(limit, MAX_LIMIT))
    try:
        offset = int(params.get("offset", 0))
    except (TypeError, ValueError):
        offset = 0
    offset = max(0, offset)
    fetch_all = str(params.get("all", "")).lower() in {"1", "true", "yes"}
    user_id = str(params.get("userId") or "").strip()
    saved_only = str(params.get("saved_only", "")).lower() in {"1", "true", "yes"}

    if saved_only and not user_id:
        return response(400, {"success": False, "error": "saved_only=1 requires userId"})

    all_items = decimal_to_native(scan_all_job_items())
    all_items.sort(key=sort_key_item, reverse=True)

    saved_ids: Set[str] = set()
    if user_id:
        try:
            saved_ids = fetch_saved_job_ids(user_id)
        except Exception as e:
            return response(
                500,
                {
                    "success": False,
                    "error": f"Failed to load saved jobs: {e}",
                },
            )

    if saved_only:
        filtered = [j for j in all_items if job_listing_id(j) in saved_ids]
        total = len(filtered)
        if fetch_all:
            page = filtered
        else:
            page = filtered[offset : offset + limit]
        for j in page:
            j["saved"] = True
        next_offset = offset + len(page)
        has_more = not fetch_all and next_offset < total
        return response(
            200,
            {
                "success": True,
                "data": {
                    "jobs": page,
                    "total": total,
                    "limit": len(page) if fetch_all else limit,
                    "offset": 0 if fetch_all else offset,
                    "has_more": has_more,
                    "saved_count": len(saved_ids),
                },
            },
        )

    total = len(all_items)
    if fetch_all:
        page = all_items
        if user_id:
            attach_saved_flags(page, saved_ids)
        return response(
            200,
            {
                "success": True,
                "data": {
                    "jobs": page,
                    "total": total,
                    "limit": total,
                    "offset": 0,
                    "has_more": False,
                    "saved_count": len(saved_ids) if user_id else None,
                },
            },
        )

    page = all_items[offset : offset + limit]
    if user_id:
        attach_saved_flags(page, saved_ids)
    next_offset = offset + len(page)
    has_more = next_offset < total
    return response(
        200,
        {
            "success": True,
            "data": {
                "jobs": page,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": has_more,
                "saved_count": len(saved_ids) if user_id else None,
            },
        },
    )


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        method = http_method(event)
        if method == "OPTIONS":
            return response(200, {"success": True})

        if method == "POST":
            body = parse_json_body(event)
            return handle_post(body)

        if method == "GET":
            return handle_get(query_params(event))

        return response(405, {"success": False, "error": f"Method {method} not allowed"})
    except Exception as exc:
        return response(500, {"success": False, "error": str(exc)})
