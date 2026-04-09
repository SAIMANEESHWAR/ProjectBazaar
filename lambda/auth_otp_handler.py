"""
Cognito USER_AUTH (email/SMS OTP) with app clients that have a client secret.

Computes SECRET_HASH server-side (HMAC-SHA256 of username+clientId, keyed by client secret,
Base64-encoded). Never expose COGNITO_CLIENT_SECRET to the browser.

Env (Lambda configuration):
  COGNITO_USER_POOL_ID
  COGNITO_USER_POOL_CLIENT_ID
  COGNITO_CLIENT_SECRET (or COGNITO_USER_POOL_CLIENT_SECRET)
  COGNITO_REGION (optional; else derived from pool id prefix, e.g. ap-south-2_xxx)
  ALLOWED_ORIGIN (CORS; comma-separated allowed, first used for single header)
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

try:
    from rate_limiter import check_rate_limit
except ImportError:
    def check_rate_limit(*args, **kwargs):
        return None


POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "").strip()
CLIENT_ID = os.environ.get("COGNITO_USER_POOL_CLIENT_ID", "").strip()
CLIENT_SECRET = (os.environ.get("COGNITO_CLIENT_SECRET") or os.environ.get("COGNITO_USER_POOL_CLIENT_SECRET") or "").strip()
REGION = os.environ.get("COGNITO_REGION", "").strip()
ALLOWED = os.environ.get("ALLOWED_ORIGIN", "https://projectbazaar.in").strip()


def _region_from_pool_id(pool_id: str) -> str:
    i = pool_id.find("_")
    if i <= 0:
        raise ValueError("Invalid COGNITO_USER_POOL_ID")
    return pool_id[:i]


def _resolved_region() -> str:
    if REGION:
        return REGION
    if not POOL_ID:
        raise ValueError("COGNITO_USER_POOL_ID is not configured")
    return _region_from_pool_id(POOL_ID)


def _secret_hash(username: str, client_id: str, client_secret: str) -> str:
    # Cognito SECRET_HASH: Base64(HMAC_SHA256(key=client_secret, msg=username + client_id))
    # Equivalent to:
    #   hmac.new(CLIENT_SECRET.encode(), (username + CLIENT_ID).encode(), hashlib.sha256) -> base64
    msg = (username + client_id).encode("utf-8")
    key = client_secret.encode("utf-8")
    digest = hmac.new(key, msg, hashlib.sha256).digest()
    return base64.b64encode(digest).decode("utf-8")


def _cors_headers() -> Dict[str, str]:
    origin = ALLOWED.split(",")[0].strip() if ALLOWED else "*"
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
    }


def _response(status: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {"statusCode": status, "headers": _cors_headers(), "body": json.dumps(body, default=str)}


def _parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    raw = event.get("body")
    if not raw:
        return {}
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def _http_path(event: Dict[str, Any]) -> str:
    path = (
        event.get("rawPath")
        or event.get("path")
        or ""
    )
    if path:
        return path
    rk = event.get("routeKey") or ""
    parts = rk.split()
    if len(parts) >= 2:
        return parts[1]
    ctx = event.get("requestContext") or {}
    http = ctx.get("http") or {}
    return http.get("path") or ""


def _normalize_phone(phone: str) -> str:
    compact = "".join(phone.split())
    if compact.startswith("+"):
        return compact
    return f"+{compact}"


def _normalize_username(channel: str, identifier: str) -> str:
    if channel == "email":
        return identifier.strip().lower()
    return _normalize_phone(identifier)


def _preferred_challenge(channel: str) -> str:
    return "EMAIL_OTP" if channel == "email" else "SMS_OTP"


def _code_response_key(challenge_name: str) -> str:
    if challenge_name == "EMAIL_OTP":
        return "EMAIL_OTP_CODE"
    if challenge_name == "SMS_OTP":
        return "SMS_OTP_CODE"
    raise ValueError(f"Unsupported OTP challenge: {challenge_name}")


def _idp():
    return boto3.client("cognito-idp", region_name="ap-south-2")


def handle_send_otp(body: Dict[str, Any]) -> Dict[str, Any]:
    if not CLIENT_ID or not CLIENT_SECRET:
        return _response(
            500,
            {"error": "COGNITO_USER_POOL_CLIENT_ID or COGNITO_CLIENT_SECRET is not configured"},
        )

    email = (body.get("email") or "").strip()
    if email:
        channel = "email"
        identifier = email
    else:
        channel = (body.get("channel") or "").strip().lower()
        identifier = (body.get("identifier") or "").strip()
        if channel not in ("email", "sms"):
            return _response(400, {"error": 'Missing or invalid channel (use "email" or "sms")'})
        if not identifier:
            return _response(400, {"error": "Missing identifier"})

    username = _normalize_username(channel, identifier)
    preferred = _preferred_challenge(channel)
    secret_hash = _secret_hash(username, CLIENT_ID, CLIENT_SECRET)
    client = _idp()

    try:
        step = client.initiate_auth(
            ClientId=CLIENT_ID,
            AuthFlow="USER_AUTH",
            AuthParameters={
                "USERNAME": username,
                "SECRET_HASH": secret_hash,
                "PREFERRED_CHALLENGE": preferred,
            },
        )
    except ClientError as e:
        return _response(400, {"error": e.response.get("Error", {}).get("Message", str(e))})

    for _ in range(6):
        print("Cognito step response:", json.dumps(step, default=str))
        if step.get("AuthenticationResult", {}).get("IdToken"):
            return _response(400, {"error": "Unexpected authentication result before OTP challenge"})

        name = step.get("ChallengeName")
        session = step.get("Session")
        if not name or not session:
            return _response(400, {"error": "Cognito did not return a challenge session"})

        if name in ("EMAIL_OTP", "SMS_OTP"):
            return _response(
                200,
                {"session": session, "challengeName": name, "username": username},
            )

        if name == "SELECT_CHALLENGE":
            try:
                step = client.respond_to_auth_challenge(
                    ClientId=CLIENT_ID,
                    ChallengeName="SELECT_CHALLENGE",
                    Session=session,
                    ChallengeResponses={
                        "USERNAME": username,
                        "SECRET_HASH": secret_hash,
                        "ANSWER": preferred,
                    },
                )
            except ClientError as e:
                return _response(400, {"error": e.response.get("Error", {}).get("Message", str(e))})
            continue

        return _response(400, {"error": f"Unsupported challenge: {name}"})

    return _response(400, {"error": "Too many authentication challenge steps"})


def handle_verify_otp(body: Dict[str, Any]) -> Dict[str, Any]:
    if not CLIENT_ID or not CLIENT_SECRET:
        return _response(
            500,
            {"error": "COGNITO_USER_POOL_CLIENT_ID or COGNITO_CLIENT_SECRET is not configured"},
        )

    username = (body.get("username") or "").strip()
    session = (body.get("session") or "").strip()
    challenge_name = (body.get("challengeName") or "").strip()
    code = (body.get("code") or "").strip()

    if not username or not session or not challenge_name or not code:
        return _response(
            400,
            {"error": "Missing username, session, challengeName, or code"},
        )

    try:
        code_key = _code_response_key(challenge_name)
    except ValueError as e:
        return _response(400, {"error": str(e)})

    secret_hash = _secret_hash(username, CLIENT_ID, CLIENT_SECRET)
    client = _idp()

    try:
        out = client.respond_to_auth_challenge(
            ClientId=CLIENT_ID,
            ChallengeName=challenge_name,
            Session=session,
            ChallengeResponses={
                "USERNAME": username,
                "SECRET_HASH": secret_hash,
                code_key: code,
            },
        )
    except ClientError as e:
        return _response(400, {"error": e.response.get("Error", {}).get("Message", str(e))})

    auth = out.get("AuthenticationResult") or {}
    id_token = auth.get("IdToken")
    access_token = auth.get("AccessToken")
    if not id_token or not access_token:
        return _response(
            400,
            {"error": "Verification failed or additional challenge required"},
        )

    payload: Dict[str, Any] = {
        "idToken": id_token,
        "accessToken": access_token,
    }
    if auth.get("RefreshToken"):
        payload["refreshToken"] = auth["RefreshToken"]

    return _response(200, payload)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    blocked = check_rate_limit(event, action="cognito_otp", max_requests=30, window_seconds=300)
    if blocked:
        return blocked

    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or ""
    ).upper()

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": _cors_headers(), "body": ""}

    path = _http_path(event)
    body = _parse_body(event)

    # Expect API Gateway paths like /auth/send-otp (Vite dev proxy strips /api from /api/auth/...)
    if path.rstrip("/").endswith("/send-otp"):
        return handle_send_otp(body)
    if path.rstrip("/").endswith("/verify-otp"):
        return handle_verify_otp(body)

    return _response(404, {"error": f"Unknown path: {path}"})
