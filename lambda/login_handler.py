import json
import re
import uuid
import hashlib
import hmac
import os
import secrets
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

try:
    from rate_limiter import check_rate_limit
except ImportError:
    def check_rate_limit(*args, **kwargs):
        return None

# ---------- CONFIG ----------
USERS_TABLE = "Users"
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://projectbazaar.in")

EMAIL_REGEX = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

# ---------- AWS ----------
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(USERS_TABLE)

# ---------- PASSWORD HASHING ----------
def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    """Hash password with PBKDF2-HMAC-SHA256. Returns (hash_hex, salt_hex)."""
    if salt is None:
        salt = secrets.token_hex(32)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        iterations=600_000,
    )
    return pw_hash.hex(), salt

def _verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """Verify a password against stored hash and salt."""
    computed_hash, _ = _hash_password(password, salt)
    return hmac.compare_digest(computed_hash, stored_hash)

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
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
            "Access-Control-Allow-Credentials": "true",
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
    # Handle CORS preflight
    http_method = event.get("httpMethod", "")
    if http_method == "OPTIONS":
        return response(200, {})

    try:
        body = json.loads(event.get("body", "{}"))
        action = body.get("action")

        if action == "signup":
            blocked = check_rate_limit(event, action="signup", max_requests=3, window_seconds=300)
            if blocked:
                return blocked
            return handle_signup(body)
        elif action == "login":
            blocked = check_rate_limit(event, action="login", max_requests=5, window_seconds=300)
            if blocked:
                return blocked
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
        FilterExpression=Attr("email").eq(email)
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
    pw_hash, pw_salt = _hash_password(password)

    table.put_item(Item={
        "userId": user_id,
        "email": email,
        "phoneNumber": phone,
        "passwordHash": pw_hash,
        "passwordSalt": pw_salt,
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
        FilterExpression=Attr("email").eq(email)
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

    stored_hash = user.get("passwordHash", "")
    stored_salt = user.get("passwordSalt")

    if stored_salt:
        if not _verify_password(password, stored_hash, stored_salt):
            return response(401, {
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid credentials"
                }
            })
    else:
        # Legacy plain-text fallback: verify then migrate to hashed
        if password != stored_hash:
            return response(401, {
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid credentials"
                }
            })
        pw_hash, pw_salt = _hash_password(password)
        table.update_item(
            Key={"userId": user["userId"]},
            UpdateExpression="SET passwordHash = :h, passwordSalt = :s",
            ExpressionAttributeValues={":h": pw_hash, ":s": pw_salt}
        )

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
