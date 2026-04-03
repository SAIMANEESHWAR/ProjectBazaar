"""
Paginated read API for JobListings DynamoDB table.
Newest first by scraped_at / created_at. Duplicates are skipped on ingest (fetch_jobs_firecrawl).
Query: ?limit=12&offset=0
"""

import json
import os
from decimal import Decimal
from typing import Any, Dict, List

import boto3

TABLE_NAME = os.environ.get("JOBS_TABLE", "JobListings")
DEFAULT_LIMIT = 12
MAX_LIMIT = 100

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


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
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
        "body": json.dumps(body, default=decimal_to_native),
    }


def sort_key(item: Dict[str, Any]) -> int:
    return int(item.get("scraped_at") or item.get("created_at") or 0)


def scan_all_items() -> List[Dict[str, Any]]:
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


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        if event.get("httpMethod") == "OPTIONS":
            return response(200, {"success": True})

        params = event.get("queryStringParameters") or {}
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

        all_items = decimal_to_native(scan_all_items())
        all_items.sort(key=sort_key, reverse=True)
        total = len(all_items)

        if fetch_all:
            return response(
                200,
                {
                    "success": True,
                    "data": {
                        "jobs": all_items,
                        "total": total,
                        "limit": total,
                        "offset": 0,
                        "has_more": False,
                    },
                },
            )

        page = all_items[offset : offset + limit]
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
                },
            },
        )
    except Exception as exc:
        return response(500, {"success": False, "error": str(exc)})
