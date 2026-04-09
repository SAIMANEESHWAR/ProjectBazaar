"""
Sync Cognito users into the legacy Users table after OTP login.

Verifies an ID token from Authorization: Bearer <token> or JSON body.idToken,
then links by email (preferred) or creates a row keyed by Cognito sub.
"""

import json
import os
from datetime import datetime
from typing import Any, Dict, Optional

import boto3
import jwt
from jwt import PyJWKClient
from boto3.dynamodb.conditions import Attr

try:
    from rate_limiter import check_rate_limit
except ImportError:
    def check_rate_limit(*args, **kwargs):
        return None

USERS_TABLE = os.environ.get("USERS_TABLE", "Users")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://projectbazaar.in")
POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
REGION = os.environ.get("COGNITO_REGION", "ap-south-2")
APP_CLIENT_ID = os.environ.get("COGNITO_APP_CLIENT_ID", "")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(USERS_TABLE)


def _headers():
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Credentials": "true",
    }


def response(status: int, body: Dict[str, Any]):
    return {"statusCode": status, "headers": _headers(), "body": json.dumps(body, default=str)}


def _header(event, name: str) -> Optional[str]:
    h = event.get("headers") or {}
    lower = {k.lower(): v for k, v in h.items()}
    return lower.get(name.lower())


def _parse_body(event) -> Dict[str, Any]:
    raw = event.get("body")
    if not raw:
        return {}
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {}
    if isinstance(raw, dict):
        return raw
    return {}


def _extract_token(event) -> Optional[str]:
    auth = _header(event, "authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    body = _parse_body(event)
    return (body.get("idToken") or body.get("id_token") or "").strip() or None


def _verify_cognito_id_token(token: str) -> Dict[str, Any]:
    if not POOL_ID:
        raise ValueError("COGNITO_USER_POOL_ID is not configured")
    jwks_url = f"https://cognito-idp.{REGION}.amazonaws.com/{POOL_ID}/.well-known/jwks.json"
    jwks_client = PyJWKClient(jwks_url)
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    issuer = f"https://cognito-idp.{REGION}.amazonaws.com/{POOL_ID}"
    options = {"require": ["exp", "sub", "iss"], "verify_aud": bool(APP_CLIENT_ID)}
    decode_kwargs: Dict[str, Any] = {
        "algorithms": ["RS256"],
        "issuer": issuer,
        "options": options,
    }
    if APP_CLIENT_ID:
        decode_kwargs["audience"] = APP_CLIENT_ID
    return jwt.decode(token, signing_key.key, **decode_kwargs)


def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return response(200, {"success": True})

    blocked = check_rate_limit(event, action="user_bootstrap", max_requests=20, window_seconds=300)
    if blocked:
        return blocked

    try:
        token = _extract_token(event)
        if not token:
            return response(
                401,
                {"success": False, "error": {"code": "UNAUTHORIZED", "message": "Missing ID token"}},
            )

        try:
            claims = _verify_cognito_id_token(token)
        except jwt.PyJWTError as e:
            return response(
                401,
                {"success": False, "error": {"code": "INVALID_TOKEN", "message": str(e)}},
            )

        sub = str(claims.get("sub") or "").strip()
        email = str(claims.get("email") or "").lower().strip()
        phone = str(claims.get("phone_number") or "").strip()
        role = "admin" if claims.get("custom:role") == "admin" else "user"

        if not sub:
            return response(
                400,
                {"success": False, "error": {"code": "INVALID_TOKEN", "message": "Token missing sub"}},
            )

        if claims.get("token_use") and claims.get("token_use") != "id":
            return response(
                401,
                {"success": False, "error": {"code": "INVALID_TOKEN", "message": "Use Cognito ID token"}},
            )

        now = datetime.utcnow().isoformat()

        # 1) Link by email to legacy user
        if email:
            scan = table.scan(FilterExpression=Attr("email").eq(email), Limit=5)
            items = scan.get("Items") or []
            if items:
                user = items[0]
                user_id = user["userId"]
                existing_sub = user.get("cognitoSub")
                if existing_sub and str(existing_sub) != sub:
                    return response(
                        409,
                        {
                            "success": False,
                            "error": {
                                "code": "IDENTITY_CONFLICT",
                                "message": "Email already linked to another Cognito user",
                            },
                        },
                    )
                table.update_item(
                    Key={"userId": user_id},
                    UpdateExpression="SET cognitoSub = :s, updatedAt = :u, emailVerified = :ev",
                    ExpressionAttributeValues={
                        ":s": sub,
                        ":u": now,
                        ":ev": True,
                    },
                )
                return response(
                    200,
                    {
                        "success": True,
                        "message": "Linked existing account",
                        "data": {
                            "userId": user_id,
                            "email": email or user.get("email"),
                            "role": user.get("role") or role,
                            "linked": True,
                        },
                    },
                )

        # 2) Sub already stored as primary id
        existing = table.get_item(Key={"userId": sub})
        if existing.get("Item"):
            u = existing["Item"]
            return response(
                200,
                {
                    "success": True,
                    "data": {
                        "userId": u.get("userId"),
                        "email": u.get("email") or email,
                        "role": u.get("role") or role,
                        "linked": False,
                    },
                },
            )

        # 3) Create new user for OTP-only accounts
        table.put_item(
            Item={
                "userId": sub,
                "email": email or f"{sub}@users.cognito.local",
                "phoneNumber": phone or "",
                "role": role,
                "status": "active",
                "emailVerified": bool(email),
                "phoneVerified": bool(phone),
                "authProvider": "cognito",
                "cognitoSub": sub,
                "isPremium": False,
                "credits": 0,
                "projectsCount": 0,
                "totalPurchases": 0,
                "totalSpent": 0,
                "wishlist": [],
                "cart": [],
                "purchases": [],
                "lastLoginAt": now,
                "loginCount": 1,
                "createdAt": now,
                "updatedAt": now,
                "createdBy": "cognito_otp",
            }
        )

        return response(
            200,
            {
                "success": True,
                "message": "User bootstrapped",
                "data": {"userId": sub, "email": email or None, "role": role, "linked": False},
            },
        )

    except Exception as e:
        print(f"bootstrap error: {e}")
        return response(
            500,
            {"success": False, "error": {"code": "INTERNAL_ERROR", "message": "Server error"}},
        )
