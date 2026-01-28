import json
import re
import uuid
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key
from decimal import Decimal

# ---------- CONFIG ----------
USERS_TABLE = "Users"

EMAIL_REGEX = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

# ---------- AWS ----------
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(USERS_TABLE)

# ---------- DECIMAL FIX ----------
def decimal_to_native(obj):
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    return obj

# ---------- RESPONSE ----------
def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST,OPTIONS"
        },
        "body": json.dumps(decimal_to_native(body))
    }

# ---------- PASSWORD VALIDATION ----------
def get_password_error(password):
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

# ---------- MAIN HANDLER ----------
def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        action = body.get("action")

        if action == "signup":
            return handle_signup(body)
        elif action == "login":
            return handle_login(body)

        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid action"
            }
        })

    except Exception as e:
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Server error",
                "details": str(e)
            }
        })

# ---------- SIGNUP ----------
def handle_signup(body):
    email = body.get("email", "").lower().strip()
    phone = body.get("phoneNumber", "")
    password = body.get("password")
    confirm_password = body.get("confirmPassword")

    if not email or not phone or not password or not confirm_password:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "All fields are required"
            }
        })

    if not re.match(EMAIL_REGEX, email):
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid email format"
            }
        })

    if password != confirm_password:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Passwords do not match"
            }
        })

    password_error = get_password_error(password)
    if password_error:
        return response(400, {
            "success": False,
            "error": {
                "code": "PASSWORD_TOO_WEAK",
                "message": password_error
            }
        })

    # ---------- CHECK EMAIL EXISTS ----------
    existing = table.scan(
        FilterExpression=Key("email").eq(email)
    )

    if existing["Count"] > 0:
        return response(409, {
            "success": False,
            "error": {
                "code": "EMAIL_ALREADY_EXISTS",
                "message": "Email already registered"
            }
        })

    user_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    table.put_item(Item={
        "userId": user_id,
        "email": email,
        "phoneNumber": phone,
        "passwordHash": password,  # ⚠️ HASH IN PRODUCTION
        "role": "user",
        "status": "active",

        "emailVerified": False,
        "phoneVerified": False,

        "isPremium": False,
        "subscription": {
            "plan": "free",
            "startedAt": None,
            "expiresAt": None
        },

        "credits": 0,
        "projectsCount": 0,
        "totalPurchases": 0,
        "totalSpent": 0,

        "wishlist": [],
        "cart": [],
        "purchases": [],

        "lastLoginAt": None,
        "loginCount": 0,

        "failedLoginAttempts": 0,
        "accountLockedUntil": None,
        "passwordUpdatedAt": now,

        "createdAt": now,
        "updatedAt": now,
        "createdBy": "self"
    })

    return response(200, {
        "success": True,
        "message": "User registered successfully",
        "data": {
            "userId": user_id,
            "email": email,
            "role": "user"
        }
    })

# ---------- LOGIN ----------
def handle_login(body):
    email = body.get("email", "").lower().strip()
    password = body.get("password")

    if not email or not password:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Email and password required"
            }
        })

    result = table.scan(
        FilterExpression=Key("email").eq(email)
    )

    if result["Count"] == 0:
        return response(404, {
            "success": False,
            "error": {
                "code": "USER_NOT_FOUND",
                "message": "User not found"
            }
        })

    user = result["Items"][0]

    if user.get("status") == "blocked":
        return response(403, {
            "success": False,
            "error": {
                "code": "ACCOUNT_BLOCKED",
                "message": "Your account is blocked",
                "blockedUntil": user.get("accountLockedUntil")
            }
        })

    if user.get("status") == "deleted":
        return response(403, {
            "success": False,
            "error": {
                "code": "ACCOUNT_DELETED",
                "message": "Your account has been deleted"
            }
        })

    if password != user["passwordHash"]:
        return response(401, {
            "success": False,
            "error": {
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid credentials"
            }
        })

    table.update_item(
        Key={"userId": user["userId"]},
        UpdateExpression="""
            SET lastLoginAt = :l,
                loginCount = if_not_exists(loginCount, :z) + :o
        """,
        ExpressionAttributeValues={
            ":l": datetime.utcnow().isoformat(),
            ":z": 0,
            ":o": 1
        }
    )

    return response(200, {
        "success": True,
        "message": "Login successful",
        "data": {
            "userId": user["userId"],
            "email": user["email"],
            "role": user["role"],
            "credits": user["credits"],
            "status": user["status"]
        }
    })
