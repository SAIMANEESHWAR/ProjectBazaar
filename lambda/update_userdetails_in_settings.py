import json
import boto3
import uuid
import urllib.request
import urllib.error
from datetime import datetime
from decimal import Decimal
from botocore.config import Config

# ---------- CONFIG ----------
USERS_TABLE = "Users"
S3_BUCKET = "project-bazaar-users-profile-images"
S3_REGION = "ap-south-2"

# ---------- AWS ----------
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(USERS_TABLE)
s3 = boto3.client(
    "s3",
    region_name=S3_REGION,
    endpoint_url=f"https://s3.{S3_REGION}.amazonaws.com",
    config=Config(
        s3={'addressing_style': 'virtual'},
        signature_version='s3v4'
    )
)

# ---------- JSON HELPER ----------
def decimal_to_native(obj):
    """Convert DynamoDB Decimal types to native Python types"""
    if isinstance(obj, list):
        return [decimal_to_native(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_native(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    else:
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

# ---------- S3 HELPERS ----------
def is_s3_url(url):
    return isinstance(url, str) and S3_BUCKET in url

def extract_s3_key(url):
    """Extract S3 key from URL - handles both regional and global formats"""
    try:
        # Try regional format
        if f"{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/" in url:
            return url.split(f"{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/")[1]
        # Try global format
        if f"{S3_BUCKET}.s3.amazonaws.com/" in url:
            return url.split(f"{S3_BUCKET}.s3.amazonaws.com/")[1]
        return None
    except Exception as e:
        print(f"extract_s3_key error: {e}")
        return None

def delete_s3_object(image_url):
    try:
        if not is_s3_url(image_url):
            return
        key = extract_s3_key(image_url)
        if key:
            s3.delete_object(Bucket=S3_BUCKET, Key=key)
            print(f"Deleted old image: {key}")
    except Exception as e:
        print(f"S3 delete failed: {e}")

# ---------- LLM API KEY TEST (OpenAI, Gemini, Claude) ----------
def _test_openai_key(api_key):
    """Validate OpenAI API key with a minimal request."""
    req = urllib.request.Request(
        "https://api.openai.com/v1/models",
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200, None
    except urllib.error.HTTPError as e:
        return False, e.read().decode("utf-8", errors="ignore") or str(e)
    except Exception as e:
        return False, str(e)


def _test_gemini_key(api_key):
    """Validate Gemini API key with generateContent."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    data = json.dumps({"contents": [{"parts": [{"text": "Hi"}]}]}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status == 200, None
    except urllib.error.HTTPError as e:
        return False, e.read().decode("utf-8", errors="ignore") or str(e)
    except Exception as e:
        return False, str(e)


def _test_claude_key(api_key):
    """Validate Claude API key with a minimal message."""
    data = json.dumps({
        "model": "claude-3-haiku-20240307",
        "max_tokens": 50,
        "messages": [{"role": "user", "content": "Hi"}],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=data,
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status == 200, None
    except urllib.error.HTTPError as e:
        return False, e.read().decode("utf-8", errors="ignore") or str(e)
    except Exception as e:
        return False, str(e)


def _test_llm_key(provider, api_key):
    """Test a single LLM API key. Returns (success, error_message)."""
    p = (provider or "").lower().strip()
    key = (api_key or "").strip()
    if not p or not key:
        return False, "Provider and API key are required"
    if p == "openai":
        return _test_openai_key(key)
    if p == "gemini":
        return _test_gemini_key(key)
    if p == "claude":
        return _test_claude_key(key)
    return False, "provider must be openai, gemini, or claude"


def handle_test_llm_api_key(body):
    provider = (body.get("provider") or "").lower().strip()
    api_key = (body.get("apiKey") or "").strip()

    if not provider or not api_key:
        return response(400, {"success": False, "message": "provider and apiKey are required"})

    ok, err = _test_llm_key(provider, api_key)
    if ok:
        return response(200, {"success": True, "message": "API key is valid"})
    return response(200, {"success": False, "message": err or "API key validation failed"})


# List of supported LLM providers (id, display name)
LLM_PROVIDERS = [
    {"id": "openai", "name": "OpenAI (GPT)"},
    {"id": "gemini", "name": "Google Gemini"},
    {"id": "claude", "name": "Anthropic Claude"},
]


def handle_get_llm_keys_status(body):
    user_id = body.get("userId")
    if not user_id:
        return response(400, {"success": False, "message": "userId is required"})

    try:
        existing = table.get_item(Key={"userId": user_id})
    except Exception as e:
        print(f"DynamoDB get_item error: {e}")
        return response(500, {"success": False, "message": str(e)})

    if "Item" not in existing:
        providers = [
            {"id": p["id"], "name": p["name"], "hasKey": False}
            for p in LLM_PROVIDERS
        ]
        return response(200, {
            "success": True,
            "hasOpenAiKey": False,
            "hasGeminiKey": False,
            "hasClaudeKey": False,
            "providers": providers,
            "savedModels": {},
        })

    keys = existing["Item"].get("llmApiKeys") or {}
    if not isinstance(keys, dict):
        keys = {}
    models = existing["Item"].get("llmModels") or {}
    if not isinstance(models, dict):
        models = {}
    has_openai = bool(keys.get("openai"))
    has_gemini = bool(keys.get("gemini"))
    has_claude = bool(keys.get("claude"))
    by_id = {"openai": has_openai, "gemini": has_gemini, "claude": has_claude}
    providers = [
        {"id": p["id"], "name": p["name"], "hasKey": by_id.get(p["id"], False)}
        for p in LLM_PROVIDERS
    ]
    saved_models = {k: v for k, v in models.items() if v}

    return response(200, {
        "success": True,
        "hasOpenAiKey": has_openai,
        "hasGeminiKey": has_gemini,
        "hasClaudeKey": has_claude,
        "providers": providers,
        "savedModels": saved_models,
    })


# ---------- ACTION: PRESIGNED URL ----------
def handle_presigned_url(body):
    user_id = body.get("userId")
    file_name = body.get("fileName")
    file_type = body.get("fileType")

    if not user_id or not file_name or not file_type:
        return response(400, {
            "success": False,
            "message": "userId, fileName and fileType are required"
        })

    ext = file_name.split(".")[-1]
    key = f"profile-images/{user_id}/{uuid.uuid4()}.{ext}"

    upload_url = s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": S3_BUCKET,
            "Key": key,
            "ContentType": file_type
        },
        ExpiresIn=300
    )

    file_url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"

    return response(200, {
        "success": True,
        "uploadUrl": upload_url,
        "fileUrl": file_url
    })

# ---------- ACTION: UPDATE SETTINGS ----------
def handle_update_settings(body):
    print("Received updateSettings body:", json.dumps(body))
    
    user_id = body.get("userId")

    if not user_id:
        return response(400, {
            "success": False,
            "message": "userId is required"
        })

    # Updated allowed_fields to include integration and freelancer profile fields
    allowed_fields = [
        "fullName",
        "role",
        "phoneNumber",
        "profilePictureUrl",
        "linkedinUrl",
        "githubUrl",
        "location",
        "hourlyRate",
        "emailNotifications",
        "pushNotifications",
        # Integration data fields
        "githubData",
        "driveData",
        "freelancerData",
        "freelancerUrl",
        # Become a Freelancer (skills, projects)
        "isFreelancer",
        "skills",
        "freelancerProjects",
        # Verifications
        "emailVerified",
        "phoneVerified",
        "paymentVerified",
        # LLM API keys for ATS / Resume Builder (stored server-side only)
        "llmApiKeys",
        # Preferred model per provider for ATS (e.g. gpt-4o-mini, gemini-1.5-flash)
        "llmModels",
    ]

    # Alias mapping for robustness
    if "hours" in body and "hourlyRate" not in body:
        body["hourlyRate"] = body["hours"]
    if "hourly_rate" in body and "hourlyRate" not in body:
        body["hourlyRate"] = body["hourly_rate"]
        
    # Handle location if sent as city/country instead of single string/object
    if "city" in body or "country" in body:
        if "location" not in body:
            city = body.get("city", "")
            country = body.get("country", "")
            if city and country:
                body["location"] = {"city": city, "country": country}
            elif city or country:
                body["location"] = city or country

    updates = {k: v for k, v in body.items() if k in allowed_fields}
    print("Updates to apply:", json.dumps(updates))

    if not updates:
        return response(400, {
            "success": False,
            "message": "No valid fields to update"
        })

    try:
        existing = table.get_item(Key={"userId": user_id})
    except Exception as e:
        print(f"DynamoDB get_item error: {e}")
        return response(500, {
            "success": False,
            "message": f"Database error: {str(e)}"
        })

    if "Item" not in existing:
        return response(404, {
            "success": False,
            "message": "User not found"
        })

    current_user = existing["Item"]

    # When saving LLM keys: test each new key before storing (any model key must pass test)
    if "llmApiKeys" in updates:
        new_keys = updates["llmApiKeys"] or {}
        if isinstance(new_keys, dict):
            for provider, api_key in new_keys.items():
                key_val = (api_key or "").strip()
                if not key_val:
                    continue
                ok, err = _test_llm_key(provider, key_val)
                if not ok:
                    return response(400, {
                        "success": False,
                        "message": f"{provider.capitalize()} API key validation failed. {err or 'Please check your key and try again.'}"
                    })

        # Merge llmApiKeys so saving one provider does not wipe others
        current_keys = current_user.get("llmApiKeys") or {}
        if not isinstance(current_keys, dict):
            current_keys = {}
        if not isinstance(new_keys, dict):
            new_keys = {}
        merged = {**current_keys, **new_keys}
        merged = {k: v for k, v in merged.items() if v}
        updates["llmApiKeys"] = merged if merged else None  # remove attribute if all cleared

    # Merge llmModels so saving one provider's model does not wipe others
    if "llmModels" in updates:
        current_models = current_user.get("llmModels") or {}
        if not isinstance(current_models, dict):
            current_models = {}
        new_models = updates["llmModels"] or {}
        if not isinstance(new_models, dict):
            new_models = {}
        merged_models = {**current_models, **new_models}
        merged_models = {k: v for k, v in merged_models.items() if v}
        updates["llmModels"] = merged_models if merged_models else None

    # Delete old image if replaced (don't let this crash the update)
    if "profilePictureUrl" in updates:
        try:
            old_url = current_user.get("profilePictureUrl")
            new_url = updates["profilePictureUrl"]
            if old_url and old_url != new_url:
                delete_s3_object(old_url)
        except Exception as e:
            print(f"Old image cleanup failed (non-fatal): {e}")

    updates["updatedAt"] = datetime.utcnow().isoformat()

    update_expr = []
    expr_attr_values = {}
    expr_attr_names = {}

    for k, v in updates.items():
        expr_attr_names[f"#{k}"] = k
        # Handle None/null values - DynamoDB doesn't support None, use empty dict/list or remove attribute
        if v is None:
            # For disconnect operations, we want to remove the attribute
            # Use REMOVE expression instead of SET
            continue
        expr_attr_values[f":{k}"] = v
        update_expr.append(f"#{k} = :{k}")

    # Handle fields that should be removed (set to None)
    remove_expr = []
    for k, v in updates.items():
        if v is None:
            remove_expr.append(f"#{k}")
            expr_attr_names[f"#{k}"] = k

    try:
        # Build update expression
        update_parts = []
        if update_expr:
            update_parts.append(f"SET {', '.join(update_expr)}")
        if remove_expr:
            update_parts.append(f"REMOVE {', '.join(remove_expr)}")
        
        update_expression = " ".join(update_parts)
        
        update_params = {
            "Key": {"userId": user_id},
            "UpdateExpression": update_expression,
            "ExpressionAttributeNames": expr_attr_names,
            "ReturnValues": "ALL_NEW"
        }
        
        if expr_attr_values:
            update_params["ExpressionAttributeValues"] = expr_attr_values
        
        result = table.update_item(**update_params)
        print("Update successful")
    except Exception as e:
        print(f"DynamoDB update_item error: {e}")
        return response(500, {
            "success": False,
            "message": f"Database update error: {str(e)}"
        })

    return response(200, {
        "success": True,
        "message": "Settings updated successfully",
        "data": result["Attributes"]
    })

# ---------- ENTRY ----------
def lambda_handler(event, context):
    try:
        if event.get("httpMethod") == "OPTIONS":
            return response(200, {})

        body = event.get("body")
        if isinstance(body, str):
            body = json.loads(body)

        action = body.get("action")

        if action == "getPresignedUrl":
            return handle_presigned_url(body)

        if action == "updateSettings":
            return handle_update_settings(body)

        if action == "testLlmApiKey":
            return handle_test_llm_api_key(body)

        if action == "getLlmKeysStatus":
            return handle_get_llm_keys_status(body)

        return response(400, {
            "success": False,
            "message": "Invalid action"
        })

    except Exception as e:
        print(f"Lambda handler ERROR: {e}")
        return response(500, {
            "success": False,
            "message": f"Internal server error: {str(e)}"
        })
