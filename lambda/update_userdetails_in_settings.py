import json
import os
import re
import io
import boto3
import uuid
import urllib.request
import urllib.error
from datetime import datetime
from decimal import Decimal
from xml.sax.saxutils import escape
from botocore.config import Config
from boto3.dynamodb.conditions import Key

# ---------- CONFIG ----------
USERS_TABLE = "Users"
ATS_HISTORY_TABLE = (os.environ.get("ATS_HISTORY_TABLE") or "AtsScoreHistory").strip() or "AtsScoreHistory"
try:
    ATS_RESUME_DOWNLOAD_TTL = max(60, min(int(os.environ.get("ATS_RESUME_DOWNLOAD_TTL", "3600")), 604800))
except ValueError:
    ATS_RESUME_DOWNLOAD_TTL = 3600
S3_BUCKET = "project-bazaar-users-profile-images"
S3_REGION = "ap-south-2"
# Override when ATS resume bucket lives in another region than S3_REGION (profile-images client).
ATS_RESUME_S3_REGION = (os.environ.get("ATS_RESUME_S3_REGION") or "").strip()

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

_s3_presign_clients = {}


def _region_from_s3_virtual_host_url(url):
    """Parse region from https://bucket.s3.<region>.amazonaws.com/... (SigV4 must match bucket region)."""
    if not url or not isinstance(url, str):
        return None
    m = re.search(r"\.s3\.([a-z0-9-]+)\.amazonaws\.com/", url)
    return m.group(1) if m else None


def _s3_client_for_presign_region(region):
    r = (region or S3_REGION).strip() or S3_REGION
    if r not in _s3_presign_clients:
        _s3_presign_clients[r] = boto3.client(
            "s3",
            region_name=r,
            config=Config(
                s3={"addressing_style": "virtual"},
                signature_version="s3v4",
            ),
        )
    return _s3_presign_clients[r]


def _ats_resume_signing_region(history_item):
    return (
        (history_item.get("resumeS3Region") or "").strip()
        or _region_from_s3_virtual_host_url(
            history_item.get("resumeFileUrl") or history_item.get("resume")
        )
        or ATS_RESUME_S3_REGION
        or S3_REGION
    )


def _ats_resume_attachment_filename(history_item):
    """Safe filename for Content-Disposition on presigned GetObject (attachment, not inline preview)."""
    fn = (history_item.get("resumeFileName") or "resume").strip() or "resume"
    fn = fn.replace("\\", "/").split("/")[-1]
    safe = re.sub(r"[^A-Za-z0-9._ -]", "_", fn).strip(" ._") or "resume"
    return safe[:180]


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


def _test_openrouter_key(api_key):
    """Validate OpenRouter API key (OpenAI-compatible models list)."""
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/models",
        headers={"Authorization": f"Bearer {api_key}"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
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
    if p == "openrouter":
        return _test_openrouter_key(key)
    if p == "gemini":
        return _test_gemini_key(key)
    if p == "claude":
        return _test_claude_key(key)
    return False, "provider must be openai, openrouter, gemini, or claude"


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
    {"id": "openrouter", "name": "OpenRouter"},
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
            "hasOpenrouterKey": False,
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
    has_openrouter = bool(keys.get("openrouter"))
    has_gemini = bool(keys.get("gemini"))
    has_claude = bool(keys.get("claude"))
    by_id = {"openai": has_openai, "openrouter": has_openrouter, "gemini": has_gemini, "claude": has_claude}
    providers = [
        {"id": p["id"], "name": p["name"], "hasKey": by_id.get(p["id"], False)}
        for p in LLM_PROVIDERS
    ]
    saved_models = {k: v for k, v in models.items() if v}

    return response(200, {
        "success": True,
        "hasOpenAiKey": has_openai,
        "hasOpenrouterKey": has_openrouter,
        "hasGeminiKey": has_gemini,
        "hasClaudeKey": has_claude,
        "providers": providers,
        "savedModels": saved_models,
    })


def handle_get_ats_score_history(body):
    user_id = body.get("userId")
    if not user_id:
        return response(400, {"success": False, "message": "userId is required"})
    try:
        lim = int(body.get("limit", 20))
    except (TypeError, ValueError):
        lim = 20
    lim = max(1, min(lim, 50))

    try:
        ht = dynamodb.Table(ATS_HISTORY_TABLE)
        qResp = ht.query(
            KeyConditionExpression=Key("userId").eq(user_id),
            ScanIndexForward=False,
            Limit=lim,
        )
        items = decimal_to_native(qResp.get("Items") or [])
        for it in items:
            bkt = it.get("resumeS3Bucket")
            s3key = it.get("resumeS3Key")
            if bkt and s3key:
                try:
                    sign_region = _ats_resume_signing_region(it)
                    s3_presign = _s3_client_for_presign_region(sign_region)
                    att_fn = _ats_resume_attachment_filename(it)
                    it["resumeDownloadUrl"] = s3_presign.generate_presigned_url(
                        ClientMethod="get_object",
                        Params={
                            "Bucket": str(bkt),
                            "Key": str(s3key),
                            "ResponseContentDisposition": f'attachment; filename="{att_fn}"',
                        },
                        ExpiresIn=ATS_RESUME_DOWNLOAD_TTL,
                    )
                except Exception as ex:
                    print(
                        f"getAtsScoreHistory presign resume bucket={bkt!r} "
                        f"region={_ats_resume_signing_region(it)!r}: {ex}"
                    )
        return response(200, {"success": True, "items": items})
    except Exception as e:
        print(f"getAtsScoreHistory error: {e}")
        return response(500, {"success": False, "message": str(e)})


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
        # Saved resume JSON + PDF export options (Settings → Resume; generateResumePdf reads both)
        "savedResumeProfile",
        "resumeExportSettings",
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

    # Normalize resume export settings (clamps, types); per-role bullet caps not used — always []
    if "resumeExportSettings" in updates:
        merged_export = _merge_resume_export_settings(updates.get("resumeExportSettings"))
        merged_export["experienceBulletLimits"] = []
        updates["resumeExportSettings"] = merged_export

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


# ---------- RESUME PDF (reportlab optional in deployment package) ----------
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.enums import TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def _html_to_bullet_lines(html):
    """Extract list items or plain lines from HTML-ish work summary."""
    if not html or not isinstance(html, str):
        return []
    items = re.findall(r"<li[^>]*>(.*?)</li>", html, re.I | re.S)
    if items:
        lines = []
        for raw in items:
            t = re.sub(r"<[^>]+>", " ", raw)
            t = re.sub(r"\s+", " ", t).strip()
            if t:
                lines.append(t)
        return lines
    t = re.sub(r"<[^>]+>", " ", html)
    return [s.strip() for s in t.replace("<br/>", "\n").replace("<br>", "\n").split("\n") if s.strip()]


def _safe_str(v, default=""):
    if v is None:
        return default
    return str(v).strip()


def _merge_resume_export_settings(raw):
    defaults = {
        "projectsCount": 1,
        "bulletsPerProject": 7,
        "experienceBulletsDefault": 3,
        "experienceTitleFormat": "1line",
        "educationTitleFormat": "1line",
        "industries": [],
        "experienceBulletLimits": [],
        "customSections": [],
    }
    if not isinstance(raw, dict):
        return defaults
    out = dict(defaults)
    for k in defaults:
        if k in raw:
            out[k] = raw[k]
    try:
        out["projectsCount"] = max(0, min(15, int(out["projectsCount"])))
    except (TypeError, ValueError):
        out["projectsCount"] = 1
    try:
        out["bulletsPerProject"] = max(1, min(20, int(out["bulletsPerProject"])))
    except (TypeError, ValueError):
        out["bulletsPerProject"] = 7
    try:
        out["experienceBulletsDefault"] = max(1, min(20, int(out["experienceBulletsDefault"])))
    except (TypeError, ValueError):
        out["experienceBulletsDefault"] = 3
    if out["experienceTitleFormat"] not in ("1line", "2line"):
        out["experienceTitleFormat"] = "1line"
    if out["educationTitleFormat"] not in ("1line", "2line"):
        out["educationTitleFormat"] = "1line"
    if not isinstance(out["industries"], list):
        out["industries"] = []
    out["industries"] = [str(x).strip() for x in out["industries"] if str(x).strip()][:20]
    if not isinstance(out["experienceBulletLimits"], list):
        out["experienceBulletLimits"] = []
    if not isinstance(out["customSections"], list):
        out["customSections"] = []
    cleaned_sections = []
    for s in out["customSections"][:10]:
        if not isinstance(s, dict):
            continue
        t = _safe_str(s.get("title") or s.get("name"))
        b = _safe_str(s.get("body") or s.get("content") or s.get("text"))
        if t or b:
            cleaned_sections.append({"title": t or "Section", "body": b})
    out["customSections"] = cleaned_sections
    return out


def _exp_bullet_limit(settings, idx, n_exp):
    lims = settings.get("experienceBulletLimits") or []
    default = settings["experienceBulletsDefault"]
    if isinstance(lims, list) and idx < len(lims):
        try:
            return max(1, min(20, int(lims[idx])))
        except (TypeError, ValueError):
            return default
    return default


def _project_bullet_lines(description, max_bullets):
    if not description or not isinstance(description, str):
        return []
    text = re.sub(r"<[^>]+>", " ", description)
    parts = re.split(r"[\n•\-\u2022]+", text)
    lines = [re.sub(r"\s+", " ", p).strip() for p in parts if p and re.sub(r"\s+", " ", p).strip()]
    return lines[:max_bullets]


def _build_resume_pdf_bytes(profile, settings):
    """Build PDF bytes; assumes reportlab is installed."""
    profile = decimal_to_native(profile) if profile else {}
    settings = _merge_resume_export_settings(settings)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=0.65 * inch,
        leftMargin=0.65 * inch,
        topMargin=0.55 * inch,
        bottomMargin=0.55 * inch,
    )
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle(
        name="ResumeH1",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=6,
        textColor="#111827",
    )
    h2 = ParagraphStyle(
        name="ResumeH2",
        parent=styles["Heading2"],
        fontSize=11,
        spaceBefore=10,
        spaceAfter=4,
        textColor="#1d4ed8",
        borderPadding=0,
    )
    body = ParagraphStyle(
        name="ResumeBody",
        parent=styles["Normal"],
        fontSize=9,
        leading=11,
        alignment=TA_LEFT,
    )
    small = ParagraphStyle(
        name="ResumeSmall",
        parent=styles["Normal"],
        fontSize=8,
        leading=10,
        textColor="#4b5563",
    )
    bullet = ParagraphStyle(
        name="ResumeBullet",
        parent=body,
        leftIndent=12,
        bulletIndent=6,
        firstLineIndent=-6,
    )

    story = []
    first = _safe_str(profile.get("firstName"))
    last = _safe_str(profile.get("lastName"))
    name = (first + " " + last).strip() or "Resume"
    story.append(Paragraph(escape(name), h1))
    jt = _safe_str(profile.get("jobTitle"))
    if jt:
        story.append(Paragraph(escape(jt), small))
    contact_bits = []
    for key in ("phone", "email", "linkedIn", "github"):
        v = _safe_str(profile.get(key))
        if v:
            contact_bits.append(v)
    web = _safe_str(profile.get("portfolio") or profile.get("website"))
    if web:
        contact_bits.append(web)
    addr = _safe_str(profile.get("address"))
    if addr:
        contact_bits.append(addr)
    if contact_bits:
        story.append(Paragraph(escape(" · ".join(contact_bits)), small))
    story.append(Spacer(1, 8))

    inds = settings.get("industries") or []
    if inds:
        story.append(Paragraph(escape("Industries: " + ", ".join(inds)), small))
        story.append(Spacer(1, 6))

    summ = _safe_str(profile.get("summary"))
    if summ:
        story.append(Paragraph("Professional summary", h2))
        story.append(Paragraph(escape(summ), body))

    skills = profile.get("skills") or []
    if isinstance(skills, list) and skills:
        story.append(Paragraph("Skills", h2))
        if skills and isinstance(skills[0], dict):
            names = [_safe_str(s.get("name")) for s in skills if _safe_str(s.get("name"))]
            line = ", ".join(names)
        else:
            line = ", ".join(_safe_str(s) for s in skills if _safe_str(s))
        if line:
            story.append(Paragraph(escape(line), body))

    experiences = profile.get("experience") or []
    if isinstance(experiences, list) and experiences:
        story.append(Paragraph("Professional experience", h2))
        for i, exp in enumerate(experiences):
            if not isinstance(exp, dict):
                continue
            title = _safe_str(exp.get("title"))
            company = _safe_str(exp.get("companyName"))
            city = _safe_str(exp.get("city"))
            state = _safe_str(exp.get("state"))
            loc = ", ".join(x for x in (city, state) if x)
            start = _safe_str(exp.get("startDate"))
            end = "Present" if exp.get("currentlyWorking") else _safe_str(exp.get("endDate"))
            dates = f"{start} – {end}" if start or end else ""

            if settings["experienceTitleFormat"] == "2line":
                if title:
                    story.append(Paragraph(escape(title), body))
                sub = []
                if company:
                    sub.append(company)
                if loc:
                    sub.append(loc)
                if dates:
                    sub.append(dates)
                if sub:
                    story.append(Paragraph(escape(" | ".join(sub)), small))
            else:
                line = title
                if company:
                    line = f"{title} @ {company}" if title else company
                bits = [line]
                if loc:
                    bits.append(loc)
                if dates:
                    bits.append(dates)
                story.append(Paragraph(escape(" — ".join(b for b in bits if b)), body))

            bullets = _html_to_bullet_lines(exp.get("workSummary"))
            cap = _exp_bullet_limit(settings, i, len(experiences))
            for b in bullets[:cap]:
                story.append(Paragraph(f"• {escape(b)}", bullet))
            story.append(Spacer(1, 4))

    projects = profile.get("projects") or []
    n_proj = settings["projectsCount"]
    bpp = settings["bulletsPerProject"]
    if isinstance(projects, list) and n_proj > 0:
        story.append(Paragraph("Projects", h2))
        for proj in projects[:n_proj]:
            if not isinstance(proj, dict):
                continue
            pname = _safe_str(proj.get("name"))
            if pname:
                story.append(Paragraph(escape(pname), body))
            desc = proj.get("description") or ""
            tech = proj.get("technologies") or []
            if isinstance(tech, list) and tech:
                tstr = ", ".join(_safe_str(t) for t in tech if _safe_str(t))
                if tstr:
                    story.append(Paragraph(escape(tstr), small))
            for line in _project_bullet_lines(desc, bpp):
                story.append(Paragraph(f"• {escape(line)}", bullet))
            story.append(Spacer(1, 4))

    education = profile.get("education") or []
    if isinstance(education, list) and education:
        story.append(Paragraph("Education", h2))
        for edu in education:
            if not isinstance(edu, dict):
                continue
            deg = _safe_str(edu.get("degree"))
            major = _safe_str(edu.get("major"))
            uni = _safe_str(edu.get("universityName"))
            start = _safe_str(edu.get("startDate"))
            end = _safe_str(edu.get("endDate"))
            dates = f"{start} – {end}" if start or end else ""
            if settings["educationTitleFormat"] == "2line":
                line1 = deg
                if major:
                    line1 = f"{deg} in {major}" if deg else major
                if line1:
                    story.append(Paragraph(escape(line1), body))
                sub = [x for x in (uni, dates) if x]
                if sub:
                    story.append(Paragraph(escape(" | ".join(sub)), small))
            else:
                parts = []
                if deg and major:
                    parts.append(f"{deg} in {major}")
                elif deg or major:
                    parts.append(deg or major)
                if uni:
                    parts.append(uni)
                if dates:
                    parts.append(dates)
                story.append(Paragraph(escape(" — ".join(parts)), body))
            desc = _safe_str(edu.get("description"))
            if desc:
                story.append(Paragraph(escape(desc), small))
            story.append(Spacer(1, 4))

    for cs in settings.get("customSections") or []:
        t = _safe_str(cs.get("title"))
        b = _safe_str(cs.get("body"))
        if t:
            story.append(Paragraph(escape(t), h2))
        if b:
            for para in b.split("\n"):
                para = para.strip()
                if para:
                    story.append(Paragraph(escape(para), body))

    doc.build(story)
    return buf.getvalue()


def handle_generate_resume_pdf(body):
    if not REPORTLAB_AVAILABLE:
        return response(
            503,
            {
                "success": False,
                "message": "PDF engine not installed. Add reportlab to the Lambda deployment package (see lambda/requirements-resume-pdf.txt).",
            },
        )

    user_id = body.get("userId")
    if not user_id:
        return response(400, {"success": False, "message": "userId is required"})

    try:
        existing = table.get_item(Key={"userId": user_id})
    except Exception as e:
        print(f"generateResumePdf get_item error: {e}")
        return response(500, {"success": False, "message": str(e)})

    if "Item" not in existing:
        return response(404, {"success": False, "message": "User not found"})

    item = decimal_to_native(existing["Item"])
    profile = item.get("savedResumeProfile")
    settings = item.get("resumeExportSettings")

    if not profile or not isinstance(profile, dict):
        return response(
            400,
            {
                "success": False,
                "message": "No saved resume profile. Save resume data from Settings first.",
            },
        )

    try:
        pdf_bytes = _build_resume_pdf_bytes(profile, settings)
    except Exception as e:
        print(f"generateResumePdf build error: {e}")
        return response(500, {"success": False, "message": f"PDF build failed: {str(e)}"})

    key = f"generated-resumes/{user_id}/{uuid.uuid4().hex}.pdf"
    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
        )
        download_url = s3.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": S3_BUCKET,
                "Key": key,
                "ResponseContentDisposition": 'attachment; filename="resume.pdf"',
            },
            ExpiresIn=3600,
        )
    except Exception as e:
        print(f"generateResumePdf S3 error: {e}")
        return response(500, {"success": False, "message": str(e)})

    return response(
        200,
        {
            "success": True,
            "pdfUrl": download_url,
            "expiresIn": 3600,
            "s3Key": key,
        },
    )


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

        if action == "getAtsScoreHistory":
            return handle_get_ats_score_history(body)

        if action == "generateResumePdf":
            return handle_generate_resume_pdf(body)

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
