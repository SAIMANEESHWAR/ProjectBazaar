"""
Admin Lambda: list/update users including UTM attribution fields.

Deploy to API Gateway endpoint used by UserManagementPage / RevenueAnalyticsPage.

POST JSON body:
  { "role": "admin", "action": "GET_ALL_USERS" }
  { "role": "admin", "action": "UPDATE_USER", "userId": "...", "status": "...", "credits": 0 }
  { "role": "admin", "action": "ADMIN_SET_PASSWORD", "userId": "...", "password": "..." }

Returns full DynamoDB user attributes so admin UI can display utmSource, utmMedium, etc.
"""
import json
import os
import re
import secrets
import traceback
import hashlib
import hmac
from datetime import datetime
from decimal import Decimal

import boto3

from admin_password_crypto import decrypt_password_for_admin, encrypt_password_for_admin

USERS_TABLE = os.environ.get("USERS_TABLE", "Users")
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://codexcareer.com")

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(USERS_TABLE)


def decimal_to_native(obj):
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    if isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj


def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(body, default=str),
    }


def _hash_password(password: str, salt: str = None):
    if salt is None:
        salt = secrets.token_hex(32)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        iterations=600_000,
    )
    return pw_hash.hex(), salt


def _attach_viewable_password(user: dict) -> dict:
    enc = user.get("loginPasswordEnc") or ""
    plain = decrypt_password_for_admin(enc) if enc else ""
    if not plain and user.get("passwordHash") and not user.get("passwordSalt"):
        plain = user.get("passwordHash") or ""
    user["viewablePassword"] = plain
    user.pop("loginPasswordEnc", None)
    return user


def handle_get_all_users():
    users = []
    scan_kwargs = {}
    while True:
        result = table.scan(**scan_kwargs)
        users.extend(result.get("Items", []))
        last_key = result.get("LastEvaluatedKey")
        if not last_key:
            break
        scan_kwargs["ExclusiveStartKey"] = last_key

    users = decimal_to_native(users)
    users = [_attach_viewable_password(u) for u in users]
    users.sort(key=lambda u: u.get("createdAt") or "", reverse=True)
    return response(200, {"success": True, "data": users, "count": len(users)})


def handle_update_user(body):
    user_id = (body.get("userId") or "").strip()
    if not user_id:
        return response(400, {"success": False, "error": "userId is required"})

    updates = []
    values = {}
    names = {}

    if "status" in body and body["status"]:
        updates.append("#s = :status")
        names["#s"] = "status"
        values[":status"] = body["status"]

    if "credits" in body and body["credits"] is not None:
        updates.append("credits = :credits")
        values[":credits"] = int(body["credits"])

    if "accountLockedUntil" in body:
        updates.append("accountLockedUntil = :locked")
        values[":locked"] = body["accountLockedUntil"]

    if not updates:
        return response(400, {"success": False, "error": "No fields to update"})

    updates.append("updatedAt = :updatedAt")
    values[":updatedAt"] = datetime.utcnow().isoformat()

    kwargs = {
        "Key": {"userId": user_id},
        "UpdateExpression": "SET " + ", ".join(updates),
        "ExpressionAttributeValues": values,
    }
    if names:
        kwargs["ExpressionAttributeNames"] = names

    table.update_item(**kwargs)
    return response(200, {"success": True, "message": "User updated", "userId": user_id})


def _password_error(password: str):
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"\d", password):
        return "Password must contain at least one number"
    if not re.search(r"[@$!%*?&#^()_+=\-\[\]{}|\\:;\"'<>,./]", password):
        return "Password must contain at least one special character"
    return None


def handle_admin_set_password(body):
    user_id = (body.get("userId") or "").strip()
    password = body.get("password") or ""

    if not user_id or not password:
        return response(400, {"success": False, "error": "userId and password are required"})

    password_error = _password_error(password)
    if password_error:
        return response(400, {"success": False, "error": password_error})

    existing = table.get_item(Key={"userId": user_id}).get("Item")
    if not existing:
        return response(404, {"success": False, "error": "User not found"})

    pw_hash, pw_salt = _hash_password(password)
    now = datetime.utcnow().isoformat()
    table.update_item(
        Key={"userId": user_id},
        UpdateExpression="""
            SET passwordHash = :h,
                passwordSalt = :s,
                loginPasswordEnc = :enc,
                passwordUpdatedAt = :p,
                updatedAt = :u,
                failedLoginAttempts = :z
        """,
        ExpressionAttributeValues={
            ":h": pw_hash,
            ":s": pw_salt,
            ":enc": encrypt_password_for_admin(password),
            ":p": now,
            ":u": now,
            ":z": 0,
        },
    )
    return response(200, {
        "success": True,
        "message": "Password updated",
        "userId": user_id,
        "viewablePassword": password,
    })


def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return response(200, {"success": True})

    try:
        body = event.get("body") or "{}"
        if isinstance(body, str):
            body = json.loads(body) if body else {}

        if body.get("role") != "admin":
            return response(403, {"success": False, "error": "Admin role required"})

        action = (body.get("action") or "").strip().upper()
        if action == "GET_ALL_USERS":
            return handle_get_all_users()
        if action == "UPDATE_USER":
            return handle_update_user(body)
        if action == "ADMIN_SET_PASSWORD":
            return handle_admin_set_password(body)

        return response(400, {"success": False, "error": f"Unknown action: {action}"})
    except Exception as exc:
        print("get_all_users_for_admin error:", exc)
        traceback.print_exc()
        return response(500, {"success": False, "error": str(exc)})
