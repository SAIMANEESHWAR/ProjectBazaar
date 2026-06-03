import base64
import json
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Attr

# ---------------- CONFIG ----------------
TABLE_NAME = os.environ.get("HACKATHONS_TABLE", "Hackathons")
DEFAULT_LIMIT = 50
MAX_LIMIT = 200

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


# ---------------- HELPERS ----------------
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


def parse_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def parse_limit(value: Any) -> int:
    try:
        num = int(value)
        return max(1, min(num, MAX_LIMIT))
    except (TypeError, ValueError):
        return DEFAULT_LIMIT


def parse_cursor(cursor: Optional[str]) -> Optional[Dict[str, Any]]:
    if not cursor:
        return None
    try:
        decoded = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode("utf-8")
        payload = json.loads(decoded)
        if isinstance(payload, dict):
            return payload
    except Exception:
        return None
    return None


def encode_cursor(last_evaluated_key: Optional[Dict[str, Any]]) -> Optional[str]:
    if not last_evaluated_key:
        return None
    raw = json.dumps(decimal_to_native(last_evaluated_key)).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")


def to_timestamp(value: Any) -> int:
    if value is None:
        return 0
    if isinstance(value, (int, float, Decimal)):
        return int(value)
    if isinstance(value, str):
        v = value.strip()
        if not v:
            return 0
        if v.isdigit():
            return int(v)
        try:
            return int(datetime.fromisoformat(v.replace("Z", "+00:00")).timestamp())
        except ValueError:
            return 0
    return 0


def sort_key(item: Dict[str, Any]) -> int:
    # latest first by post date (created_at), with safe fallbacks.
    return (
        to_timestamp(item.get("post_date"))
        or to_timestamp(item.get("created_at"))
        or to_timestamp(item.get("start_date"))
        or to_timestamp(item.get("end_date"))
    )


def build_filter_expression(status: Optional[str], hack_type: Optional[str]):
    filter_expr = None
    if status:
        filter_expr = Attr("status").eq(status)
    if hack_type:
        type_expr = Attr("type").eq(hack_type)
        filter_expr = type_expr if filter_expr is None else filter_expr & type_expr
    return filter_expr


def scan_all_with_filters(filter_expr=None) -> List[Dict[str, Any]]:
    items: List[Dict[str, Any]] = []
    last_key = None
    while True:
        scan_kwargs: Dict[str, Any] = {}
        if filter_expr is not None:
            scan_kwargs["FilterExpression"] = filter_expr
        if last_key:
            scan_kwargs["ExclusiveStartKey"] = last_key

        db_resp = table.scan(**scan_kwargs)
        items.extend(db_resp.get("Items", []))
        last_key = db_resp.get("LastEvaluatedKey")
        if not last_key:
            break
    return items


# ---------------- LAMBDA ----------------
def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return response(200, {"success": True})

        print("========== GET HACKATHONS API ==========")
        print("Event:", json.dumps(event))

        params = event.get("queryStringParameters") or {}
        print("Filters:", params)

        status = params.get("status")  # upcoming | live
        hack_type = params.get("type")  # online | offline | hybrid
        limit = parse_limit(params.get("limit", DEFAULT_LIMIT))
        cursor = params.get("cursor")
        all_data = parse_bool(params.get("all"), default=False)

        filter_expr = build_filter_expression(status, hack_type)

        # all=true => scan the whole table (all pages), then sort latest first.
        if all_data:
            all_items = scan_all_with_filters(filter_expr)
            all_items = decimal_to_native(all_items)
            all_items.sort(key=sort_key, reverse=True)

            return response(
                200,
                {
                    "success": True,
                    "count": len(all_items),
                    "hackathons": all_items,
                },
            )

        # Paginated scan mode using DynamoDB LastEvaluatedKey cursor.
        scan_kwargs: Dict[str, Any] = {"Limit": limit}
        if filter_expr is not None:
            scan_kwargs["FilterExpression"] = filter_expr

        start_key = parse_cursor(cursor)
        if start_key:
            scan_kwargs["ExclusiveStartKey"] = start_key

        db_resp = table.scan(**scan_kwargs)
        items = decimal_to_native(db_resp.get("Items", []))
        items.sort(key=sort_key, reverse=True)

        next_cursor = encode_cursor(db_resp.get("LastEvaluatedKey"))

        print("Items fetched:", len(items))
        print("Has next cursor:", bool(next_cursor))

        return response(
            200,
            {
                "success": True,
                "count": len(items),
                "hackathons": items,
                "limit": limit,
                "next_cursor": next_cursor,
            },
        )

    except Exception as exc:
        print("Lambda error:", str(exc))
        return response(
            500,
            {
                "success": False,
                "error": str(exc),
            },
        )
