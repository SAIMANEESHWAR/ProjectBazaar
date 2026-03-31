import base64
import json
import os
import uuid
from datetime import datetime, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

TABLE_NAME = os.environ.get("LIVE_MOCK_INTERVIEW_TABLE", "LiveMockInterviewResults")

_dynamodb = boto3.resource("dynamodb")
_table = _dynamodb.Table(TABLE_NAME)

CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,x-user-id",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def get_method(event):
    ctx = event.get("requestContext") or {}
    http = ctx.get("http") or {}
    return (http.get("method") or event.get("httpMethod") or "GET").upper()


def parse_body(event):
    raw = event.get("body")
    if not raw:
        return {}
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return None


def to_jsonable(value):
    if isinstance(value, list):
        return [to_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: to_jsonable(v) for k, v in value.items()}
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    return value


def validate_payload(body):
    required = ["userId", "track", "level", "sessionLabel", "durationSec", "finishedFullSession", "evaluation"]
    missing = [k for k in required if k not in body]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"
    if not isinstance(body.get("evaluation"), dict):
        return "evaluation must be an object"
    return None


def create_result(body):
    err = validate_payload(body)
    if err:
        return response(400, {"success": False, "error": err})

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    item = {
        "interviewId": str(uuid.uuid4()),
        "userId": str(body["userId"]).strip(),
        "provider": body.get("provider"),
        "model": body.get("model"),
        "track": str(body["track"]).strip(),
        "level": str(body["level"]).strip(),
        "sessionLabel": str(body["sessionLabel"]).strip(),
        "durationSec": int(body["durationSec"]),
        "finishedFullSession": bool(body["finishedFullSession"]),
        "evaluation": body["evaluation"],
        "createdAt": now,
    }
    item = {k: v for k, v in item.items() if v is not None}

    try:
        _table.put_item(Item=item)
        return response(201, {"success": True, "data": item})
    except ClientError as exc:
        return response(500, {"success": False, "error": str(exc)})


def list_results(event):
    query = event.get("queryStringParameters") or {}
    user_id = (query.get("userId") or "").strip()
    if not user_id:
        return response(400, {"success": False, "error": "userId is required"})

    try:
        # Table should have userId as PK or GSI for production. Scan keeps this drop-in compatible.
        scanned = _table.scan()
        items = scanned.get("Items", [])
        while "LastEvaluatedKey" in scanned:
            scanned = _table.scan(ExclusiveStartKey=scanned["LastEvaluatedKey"])
            items.extend(scanned.get("Items", []))

        filtered = [to_jsonable(i) for i in items if str(i.get("userId", "")).strip() == user_id]
        filtered.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return response(200, {"success": True, "data": filtered})
    except ClientError as exc:
        return response(500, {"success": False, "error": str(exc)})


def lambda_handler(event, context):
    method = get_method(event)
    if method == "OPTIONS":
        return response(200, {"ok": True})
    if method == "POST":
        body = parse_body(event)
        if body is None:
            return response(400, {"success": False, "error": "Invalid JSON body"})
        return create_result(body)
    if method == "GET":
        return list_results(event)
    return response(405, {"success": False, "error": f"Method {method} not allowed"})

