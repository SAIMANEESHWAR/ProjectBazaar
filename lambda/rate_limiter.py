"""
Sliding-window rate limiter backed by DynamoDB.

Table: RateLimits
  PK: pk  (string)  — composite key, e.g. "login:<ip>" or "signup:<ip>"
  Attributes:
    hits       (number)  — request count in current window
    windowStart (string) — ISO timestamp of window start
    ttl        (number)  — epoch seconds for DynamoDB TTL auto-deletion

DynamoDB TTL must be enabled on the `ttl` attribute so stale records
are automatically cleaned up.

Usage in a handler:
    from rate_limiter import check_rate_limit
    blocked = check_rate_limit(event, action="login", max_requests=5, window_seconds=300)
    if blocked:
        return blocked   # returns a 429 response dict
"""

import json
import time
import boto3
from datetime import datetime
from decimal import Decimal

RATE_LIMIT_TABLE = "RateLimits"

dynamodb = boto3.resource("dynamodb")
rate_table = dynamodb.Table(RATE_LIMIT_TABLE)


def _get_client_ip(event: dict) -> str:
    """Extract client IP from API Gateway event."""
    try:
        rc = event.get("requestContext", {})
        identity = rc.get("identity", {})
        ip = identity.get("sourceIp")
        if ip:
            return ip
    except Exception:
        pass

    headers = event.get("headers", {}) or {}
    for key in ("X-Forwarded-For", "x-forwarded-for"):
        val = headers.get(key)
        if val:
            return val.split(",")[0].strip()

    return "unknown"


def _rate_limit_response():
    return {
        "statusCode": 429,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "https://projectbazaar.in",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Retry-After": "60",
        },
        "body": json.dumps({
            "success": False,
            "error": {
                "code": "RATE_LIMITED",
                "message": "Too many requests. Please try again later.",
            },
        }),
    }


def check_rate_limit(
    event: dict,
    action: str,
    max_requests: int = 5,
    window_seconds: int = 300,
):
    """
    Returns None if request is allowed, or a 429 response dict if blocked.

    Parameters:
        event           – raw Lambda event from API Gateway
        action          – logical name (e.g. "login", "signup")
        max_requests    – maximum hits allowed per window
        window_seconds  – window duration in seconds
    """
    ip = _get_client_ip(event)
    pk = f"{action}:{ip}"
    now = time.time()
    now_iso = datetime.utcnow().isoformat()

    try:
        resp = rate_table.get_item(Key={"pk": pk})
        item = resp.get("Item")

        if item:
            window_start_epoch = float(item.get("windowStartEpoch", 0))
            hits = int(item.get("hits", 0))

            if now - window_start_epoch < window_seconds:
                if hits >= max_requests:
                    return _rate_limit_response()

                rate_table.update_item(
                    Key={"pk": pk},
                    UpdateExpression="SET hits = hits + :one",
                    ExpressionAttributeValues={":one": Decimal("1")},
                )
                return None
            # Window expired — reset
        # New record or expired window
        rate_table.put_item(Item={
            "pk": pk,
            "hits": Decimal("1"),
            "windowStart": now_iso,
            "windowStartEpoch": Decimal(str(int(now))),
            "ttl": Decimal(str(int(now + window_seconds * 2))),
        })
        return None

    except Exception:
        # If rate-limit infra fails, allow the request through
        # (fail-open to avoid locking out all users)
        return None
