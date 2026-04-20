"""
Single Lambda: email/password auth + Google OAuth + optional API Gateway TOKEN authorizer.

HTTP POST JSON body must include "action":

- "signup" — Email + phone + password.
- "login" — Email + password.
- "google_oauth_config" — returns { googleEnabled, clientId? }; client id comes from env only.
- "google_oauth_exchange" — code + redirect_uri + code_verifier (PKCE).

Environment (this Lambda only):
  GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ALLOWED_ORIGIN

Also handles API Gateway custom authorizer invocations (event.type == "TOKEN") using the same
GOOGLE_CLIENT_ID to validate Google ID tokens (Bearer).

For best performance, include PyJWT + cryptography in the deployment package.
If unavailable, verification falls back to Google's tokeninfo endpoint.
"""
import json
import re
import uuid
import hashlib
import hmac
import os
import secrets
import urllib.error
import urllib.parse
import urllib.request
import boto3
import traceback
from datetime import datetime
from typing import Optional, Tuple
from boto3.dynamodb.conditions import Key, Attr
from decimal import Decimal

try:
    from rate_limiter import check_rate_limit
except ImportError:
    def check_rate_limit(*args, **kwargs):
        return None

try:
    import jwt
    from jwt import PyJWKClient
except ImportError:
    jwt = None  # type: ignore
    PyJWKClient = None  # type: ignore

# ---------- CONFIG ----------
USERS_TABLE = "Users"
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://codexcareer.com")

# Google OAuth Web client — keep ID + secret only in Lambda configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "").strip()

EMAIL_REGEX = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

# ---------- AWS ----------
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(USERS_TABLE)

# ---------- PASSWORD HASHING ----------
def _hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
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
    print("login_handler invoked", json.dumps({
        "hasType": "type" in event,
        "type": event.get("type"),
        "httpMethod": event.get("httpMethod"),
        "path": event.get("path"),
        "hasAuthorizationToken": "authorizationToken" in event,
    }))

    # Same Lambda as API Gateway TOKEN authorizer (Google Bearer JWT)
    if event.get("type") == "TOKEN" and "authorizationToken" in event:
        return _handle_google_token_authorizer(event)

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
        elif action == "google_oauth_config":
            return handle_google_oauth_config(body)
        elif action == "google_oauth_exchange":
            blocked = check_rate_limit(
                event, action="google_oauth_exchange", max_requests=15, window_seconds=300
            )
            if blocked:
                return blocked
            return handle_google_oauth_exchange(body)

        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid action"
            }
        })

    except Exception as e:
        print("Unhandled lambda_handler exception:", str(e))
        traceback.print_exc()
        return response(500, {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Server error",
                "detail": str(e),
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


def handle_google_oauth_config(_body):
    """Expose OAuth client id to the SPA; secret never leaves Lambda."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return response(200, {
            "success": True,
            "data": {"googleEnabled": False},
        })
    return response(200, {
        "success": True,
        "data": {
            "googleEnabled": True,
            "clientId": GOOGLE_CLIENT_ID,
        },
    })


# ---------- GOOGLE OAUTH (authorization code + PKCE, secret on server) ----------
_google_jwks_client = None


def _get_google_jwks_client():
    global _google_jwks_client
    if jwt is None or PyJWKClient is None:
        return None
    if _google_jwks_client is None:
        _google_jwks_client = PyJWKClient(
            "https://www.googleapis.com/oauth2/v3/certs"
        )
    return _google_jwks_client


def _decode_google_id_token_via_tokeninfo(id_token: str) -> dict:
    """
    Fallback verifier when PyJWT is unavailable.
    Uses Google's tokeninfo endpoint and performs local claim checks.
    """
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("GOOGLE_CLIENT_ID must be set")

    url = (
        "https://oauth2.googleapis.com/tokeninfo?"
        + urllib.parse.urlencode({"id_token": id_token})
    )
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            claims = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        raise RuntimeError(f"Google tokeninfo HTTP {e.code}: {err_body}") from e

    aud = str(claims.get("aud", "")).strip()
    if aud != GOOGLE_CLIENT_ID:
        raise RuntimeError("Token audience mismatch")

    issuer = str(claims.get("iss", "")).strip()
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        raise RuntimeError("Token issuer mismatch")

    exp_raw = claims.get("exp")
    try:
        exp = int(exp_raw)
    except (TypeError, ValueError):
        raise RuntimeError("Token exp claim is invalid")
    if exp <= int(datetime.utcnow().timestamp()):
        raise RuntimeError("Token is expired")

    return claims


def _decode_google_id_token(id_token: str) -> dict:
    if not GOOGLE_CLIENT_ID:
        raise RuntimeError("GOOGLE_CLIENT_ID must be set")
    if jwt is None:
        return _decode_google_id_token_via_tokeninfo(id_token)
    client = _get_google_jwks_client()
    if client is None:
        raise RuntimeError("Could not load Google JWKS client")
    key = client.get_signing_key_from_jwt(id_token)
    return jwt.decode(
        id_token,
        key.key,
        algorithms=["RS256"],
        audience=GOOGLE_CLIENT_ID,
        issuer="https://accounts.google.com",
        leeway=120,
    )


def _handle_google_token_authorizer(event):
    """API Gateway REST TOKEN authorizer — validates Google ID token."""
    if jwt is None:
        raise Exception("Unauthorized")

    auth = (event.get("authorizationToken") or "").strip()
    if auth.startswith("Bearer "):
        auth = auth[7:].strip()
    if not auth:
        raise Exception("Unauthorized")

    method_arn = event.get("methodArn") or "*"

    try:
        claims = _decode_google_id_token(auth)
    except Exception:
        raise Exception("Unauthorized")

    sub = str(claims.get("sub", ""))
    email = str(claims.get("email", ""))

    return {
        "principalId": sub or "google-user",
        "policyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": "Allow",
                    "Resource": method_arn,
                }
            ],
        },
        "context": {
            "googleSub": sub,
            "email": email,
        },
    }


def _google_exchange_code(code: str, redirect_uri: str, code_verifier: str) -> dict:
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise RuntimeError("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set")
    data = urllib.parse.urlencode(
        {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "code_verifier": code_verifier,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=data,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        raise RuntimeError(f"Google token endpoint HTTP {e.code}: {err_body}") from e


def _find_user_by_email_or_google_sub(email: str, google_sub: str):
    r = table.scan(FilterExpression=Attr("email").eq(email))
    if r.get("Count", 0) > 0:
        return r["Items"][0]
    r2 = table.scan(FilterExpression=Attr("googleSub").eq(google_sub))
    if r2.get("Count", 0) > 0:
        return r2["Items"][0]
    return None


def handle_google_oauth_exchange(body):
    """
    Exchange auth code + PKCE for Google tokens; verify id_token; upsert Users.
    Body: code, redirect_uri, code_verifier (must match SPA authorize step).
    """
    code = (body.get("code") or "").strip()
    redirect_uri = (body.get("redirect_uri") or "").strip()
    code_verifier = (body.get("code_verifier") or "").strip()

    if not code or not redirect_uri or not code_verifier:
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "code, redirect_uri, and code_verifier are required",
            },
        })

    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return response(501, {
            "success": False,
            "error": {
                "code": "NOT_CONFIGURED",
                "message": "Google OAuth is not configured on the server (GOOGLE_CLIENT_ID/SECRET)",
            },
        })

    try:
        token_payload = _google_exchange_code(code, redirect_uri, code_verifier)
    except Exception as e:
        return response(400, {
            "success": False,
            "error": {
                "code": "GOOGLE_TOKEN_EXCHANGE_FAILED",
                "message": str(e),
            },
        })

    id_token = (token_payload.get("id_token") or "").strip()
    if not id_token:
        return response(400, {
            "success": False,
            "error": {
                "code": "INVALID_RESPONSE",
                "message": "Google did not return id_token",
            },
        })

    try:
        claims = _decode_google_id_token(id_token)
    except Exception as e:
        return response(401, {
            "success": False,
            "error": {
                "code": "INVALID_TOKEN",
                "message": "Could not verify Google ID token",
                "detail": str(e),
            },
        })

    email = (claims.get("email") or "").lower().strip()
    google_sub = claims.get("sub") or ""
    if not email or not re.match(EMAIL_REGEX, email):
        return response(400, {
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Google token has no valid email claim",
            },
        })
    if not google_sub:
        return response(400, {
            "success": False,
            "error": {"code": "VALIDATION_ERROR", "message": "Google token has no sub"},
        })

    try:
        user = _find_user_by_email_or_google_sub(email, google_sub)
    except Exception as e:
        return response(500, {
            "success": False,
            "error": {
                "code": "USER_LOOKUP_FAILED",
                "message": "Could not check existing account",
                "detail": str(e),
            },
        })
    now = datetime.utcnow().isoformat()

    if user:
        if user.get("status") == "blocked":
            return response(403, {
                "success": False,
                "error": {
                    "code": "ACCOUNT_BLOCKED",
                    "message": "Your account is blocked",
                    "blockedUntil": user.get("accountLockedUntil"),
                },
            })
        if user.get("status") == "deleted":
            return response(403, {
                "success": False,
                "error": {
                    "code": "ACCOUNT_DELETED",
                    "message": "Your account has been deleted",
                },
            })

        uid = user["userId"]
        try:
            table.update_item(
                Key={"userId": uid},
                UpdateExpression="""
                    SET lastLoginAt = :l,
                        loginCount = if_not_exists(loginCount, :z) + :o,
                        googleSub = :g,
                        updatedAt = :u
                """,
                ExpressionAttributeValues={
                    ":l": now,
                    ":z": 0,
                    ":o": 1,
                    ":g": google_sub,
                    ":u": now,
                },
            )
            refreshed = table.get_item(Key={"userId": uid}).get("Item") or user
        except Exception as e:
            return response(500, {
                "success": False,
                "error": {
                    "code": "USER_UPDATE_FAILED",
                    "message": "Could not update account during login",
                    "detail": str(e),
                },
            })
        return response(200, {
            "success": True,
            "message": "Login successful",
            "data": {
                "userId": refreshed["userId"],
                "email": refreshed["email"],
                "role": refreshed.get("role", "user"),
                "credits": refreshed.get("credits", 0),
                "status": refreshed.get("status", "active"),
                "idToken": id_token,
            },
        })

    user_id = str(uuid.uuid4())
    random_pw = secrets.token_urlsafe(48)
    pw_hash, pw_salt = _hash_password(random_pw)

    try:
        table.put_item(
            Item={
                "userId": user_id,
                "email": email,
                "passwordHash": pw_hash,
                "passwordSalt": pw_salt,
                "role": "user",
                "status": "active",
                "googleSub": google_sub,
                "authProvider": "google",
                "emailVerified": True,
                "phoneVerified": False,
                "isPremium": False,
                "subscription": {
                    "plan": "free",
                    "startedAt": None,
                    "expiresAt": None,
                },
                "credits": 0,
                "projectsCount": 0,
                "totalPurchases": 0,
                "totalSpent": 0,
                "wishlist": [],
                "cart": [],
                "purchases": [],
                "lastLoginAt": now,
                "loginCount": 1,
                "failedLoginAttempts": 0,
                "accountLockedUntil": None,
                "passwordUpdatedAt": now,
                "createdAt": now,
                "updatedAt": now,
                "createdBy": "google_oauth",
            }
        )
    except Exception as e:
        return response(500, {
            "success": False,
            "error": {
                "code": "USER_CREATE_FAILED",
                "message": "Could not create account from Google sign-in",
                "detail": str(e),
            },
        })

    return response(200, {
        "success": True,
        "message": "Login successful",
        "data": {
            "userId": user_id,
            "email": email,
            "role": "user",
            "credits": 0,
            "status": "active",
            "idToken": id_token,
        },
    })
