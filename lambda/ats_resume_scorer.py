"""
ATS Resume Scorer Lambda.

Modes:
1) BYOK provider — POST JSON with provider + API key, jobDescription, and either resumeText OR
   resumeBase64 + resumeFileName (.pdf / .docx). Supports openai/openrouter/gemini/anthropic; key is not stored.
2) Legacy — userId + jobDescription + resumeText or resumeBase64: loads llmApiKeys from DynamoDB Users,
   uses selected provider or OpenAI → Claude → Gemini → OpenRouter.

Optional env:
- ATS_HISTORY_TABLE (default AtsScoreHistory): save reports when userId present
- ATS_RESUME_S3_BUCKET: if set, upload resume bytes to S3 when saving history; stores resumeS3Bucket, resumeS3Key, resumeFileUrl, resume (same URL) on the item
- ATS_RESUME_S3_PREFIX (default ats-resume-history/): key prefix under the bucket
- ENABLE_TEXTRACT_OCR=1, OCR_MAX_PDF_PAGES (default 3): AWS Textract for scanned PDFs (needs IAM)

Dependencies: PyPDF2, PyMuPDF (fitz), python-docx (see ats_resume_scorer_requirements.txt).
"""

import base64
import io
import json
import os
import re
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

USERS_TABLE = "Users"
ATS_HISTORY_TABLE_NAME = (os.environ.get("ATS_HISTORY_TABLE") or "AtsScoreHistory").strip() or "AtsScoreHistory"
ENABLE_TEXTRACT_OCR = os.environ.get("ENABLE_TEXTRACT_OCR", "").lower() in ("1", "true", "yes")
try:
    OCR_MAX_PDF_PAGES = max(1, min(10, int(os.environ.get("OCR_MAX_PDF_PAGES", "3"))))
except ValueError:
    OCR_MAX_PDF_PAGES = 3
try:
    MIN_PDF_TEXT_CHARS = max(5, int(os.environ.get("MIN_PDF_TEXT_CHARS", "40")))
except ValueError:
    MIN_PDF_TEXT_CHARS = 40

OPENROUTER_DEFAULT_MODEL = (os.environ.get("OPENROUTER_DEFAULT_MODEL") or "openai/gpt-4o-mini").strip()
OPENROUTER_HTTP_REFERER = (os.environ.get("OPENROUTER_HTTP_REFERER") or "https://projectbazaar.app").strip()

ATS_RESUME_S3_BUCKET = (os.environ.get("ATS_RESUME_S3_BUCKET") or "").strip()
ATS_RESUME_S3_PREFIX = (os.environ.get("ATS_RESUME_S3_PREFIX") or "ats-resume-history/").strip()
if ATS_RESUME_S3_PREFIX and not ATS_RESUME_S3_PREFIX.endswith("/"):
    ATS_RESUME_S3_PREFIX += "/"

dynamodb = boto3.resource("dynamodb")
users_table = dynamodb.Table(USERS_TABLE)
history_table = dynamodb.Table(ATS_HISTORY_TABLE_NAME)
_s3_client = None


def _get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3")
    return _s3_client


def _content_type_for_resume_filename(filename: str) -> str:
    fn = (filename or "").lower()
    if fn.endswith(".pdf"):
        return "application/pdf"
    if fn.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if fn.endswith(".txt"):
        return "text/plain; charset=utf-8"
    return "application/octet-stream"


def _s3_object_https_url(bucket: str, key: str) -> str:
    region = (os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "ap-south-2").strip()
    enc_key = urllib.parse.quote(key, safe="/")
    return f"https://{bucket}.s3.{region}.amazonaws.com/{enc_key}"


def _upload_resume_to_s3(user_id: str, report_id: str, raw_bytes: bytes, file_name: str):
    """Upload resume file for history row. Returns (bucket, key) or (None, None) on skip/failure."""
    if not ATS_RESUME_S3_BUCKET:
        print("ATS history S3: skipped — set Lambda env ATS_RESUME_S3_BUCKET to your bucket name")
        return None, None
    if not user_id:
        return None, None
    if not raw_bytes:
        print("ATS history S3: skipped — no bytes to upload (caller should pass file bytes or text fallback)")
        return None, None
    base = (file_name or "resume.pdf").replace("\\", "/").split("/")[-1]
    safe = re.sub(r"[^a-zA-Z0-9._-]", "_", base)[:120] or "resume.bin"
    if "." not in safe:
        safe += ".pdf"
    key = f"{ATS_RESUME_S3_PREFIX}{user_id}/{report_id}_{safe}"
    try:
        _get_s3_client().put_object(
            Bucket=ATS_RESUME_S3_BUCKET,
            Key=key,
            Body=raw_bytes,
            ContentType=_content_type_for_resume_filename(safe),
            ServerSideEncryption="AES256",
        )
        print(f"ATS history S3: OK put_object bucket={ATS_RESUME_S3_BUCKET} key={key}")
        return ATS_RESUME_S3_BUCKET, key
    except ClientError as e:
        print(f"ATS resume S3 upload ClientError: {e}")
        return None, None
    except Exception as e:
        print(f"ATS resume S3 upload error: {e}")
        return None, None


WEIGHTS = {
    "skillsMatch": 30,
    "experience": 25,
    "education": 15,
    "formatting": 15,
    "achievements": 10,
    "locationAndSoft": 5,
}


def response(status, body):
    return {
        "statusCode": status,
        "isBase64Encoded": False,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": json.dumps(body),
    }


def _http_method(event):
    m = event.get("httpMethod")
    if m:
        return m.upper()
    rc = event.get("requestContext") or {}
    if isinstance(rc.get("http"), dict) and rc["http"].get("method"):
        return str(rc["http"]["method"]).upper()
    if rc.get("httpMethod"):
        return str(rc["httpMethod"]).upper()
    return "GET"


def _parse_request_body(event):
    """Support REST API, HTTP API (v2), and plain dict bodies."""
    raw = event.get("body")
    if raw is None:
        return {}
    try:
        if event.get("isBase64Encoded") and isinstance(raw, str):
            raw = base64.b64decode(raw).decode("utf-8")
        if isinstance(raw, str):
            return json.loads(raw) if raw.strip() else {}
        if isinstance(raw, dict):
            return raw
    except (json.JSONDecodeError, TypeError, ValueError) as e:
        print(f"_parse_request_body: {e}")
    return {}


def _field_str(data, *keys):
    for k in keys:
        v = data.get(k)
        if v is None:
            continue
        s = str(v).strip()
        if s:
            return s
    return ""


def _normalize_provider(value):
    p = (value or "").strip().lower()
    if p in ("openai",):
        return "openai"
    if p in ("gemini", "google", "google-gemini"):
        return "gemini"
    if p in ("anthropic", "claude"):
        return "anthropic"
    if p in ("openrouter", "open-router"):
        return "openrouter"
    return ""


def _extract_byok_credentials(body):
    provider = _normalize_provider(_field_str(body, "provider", "llmProvider", "llm_provider"))
    generic_key = _field_str(body, "apiKey", "api_key", "llmApiKey", "llm_api_key")

    openai_key = _field_str(body, "openaiApiKey", "openai_api_key")
    gemini_key = _field_str(body, "geminiApiKey", "gemini_api_key")
    anthropic_key = _field_str(body, "anthropicApiKey", "anthropic_api_key", "claudeApiKey", "claude_api_key")
    openrouter_key = _field_str(body, "openrouterApiKey", "openrouter_api_key")

    if not provider:
        if openai_key:
            provider = "openai"
        elif openrouter_key:
            provider = "openrouter"
        elif anthropic_key:
            provider = "anthropic"
        elif gemini_key:
            provider = "gemini"

    if provider == "openai":
        api_key = openai_key or generic_key
    elif provider == "openrouter":
        api_key = openrouter_key or generic_key
    elif provider == "anthropic":
        api_key = anthropic_key or generic_key
    elif provider == "gemini":
        api_key = gemini_key or generic_key
    else:
        api_key = ""

    model = _field_str(body, "model", "llmModel", "llm_model")
    if not model:
        if provider == "openai":
            model = _field_str(body, "openaiModel", "openai_model")
        elif provider == "openrouter":
            model = _field_str(body, "openrouterModel", "openrouter_model")
        elif provider == "anthropic":
            model = _field_str(body, "anthropicModel", "anthropic_model", "claudeModel", "claude_model")
        elif provider == "gemini":
            model = _field_str(body, "geminiModel", "gemini_model")

    return provider, api_key, model


def _pypdf_extract(data: bytes) -> str:
    import PyPDF2

    reader = PyPDF2.PdfReader(io.BytesIO(data))
    parts = []
    for page in reader.pages:
        t = page.extract_text()
        if t:
            parts.append(t)
    return "\n".join(parts).strip()


def _fitz_text_extract(data: bytes) -> str:
    import fitz

    doc = fitz.open(stream=data, filetype="pdf")
    parts = []
    for i in range(doc.page_count):
        parts.append(doc.load_page(i).get_text("text") or "")
    doc.close()
    return "\n".join(parts).strip()


def _fitz_textract_ocr(data: bytes) -> str:
    import fitz

    textract = boto3.client("textract")
    doc = fitz.open(stream=data, filetype="pdf")
    out = []
    n = min(doc.page_count, OCR_MAX_PDF_PAGES)
    for i in range(n):
        page = doc.load_page(i)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        png = pix.tobytes("png")
        resp = textract.detect_document_text(Document={"Bytes": png})
        lines = [b.get("Text", "") for b in resp.get("Blocks", []) if b.get("BlockType") == "LINE"]
        out.append("\n".join(lines))
    doc.close()
    return "\n".join(out).strip()


def structure_resume_sections(text: str) -> str:
    """Insert clearer breaks before common résumé headings (helps LLM section quality)."""
    if not text:
        return text
    pattern = re.compile(
        r"(?m)(^\s*(?:EXPERIENCE|WORK\s+EXPERIENCE|EDUCATION|SKILLS|PROJECTS?|SUMMARY|"
        r"CERTIFICATIONS?|ACHIEVEMENTS?|TECHNICAL\s+SKILLS|PUBLICATIONS?|INTERNSHIP|CERTIFICATES?)\s*:?\s*$)",
        re.I,
    )

    def _break_before(m):
        return "\n\n" + m.group(1).strip() + "\n"

    out = pattern.sub(_break_before, text)
    return re.sub(r"\n{3,}", "\n\n", out).strip()


def _pdf_extraction_deps_missing_hint(notes):
    """If errors are ImportError-style, tell operators to bundle libs (common Lambda packaging mistake)."""
    blob = " ".join(notes)
    if "No module named 'PyPDF2'" in blob or "No module named 'fitz'" in blob:
        return (
            " The function bundle is missing PyPDF2 and/or PyMuPDF: install "
            "lambda/ats_resume_scorer_requirements.txt into the deployment zip/layer "
            "(see ATS_RESUME_SCORER_SETUP.md or run lambda/build_ats_zip.py)."
        )
    return ""


def extract_text_from_bytes(data: bytes, filename: str) -> str:
    """Extract plain text from PDF or DOCX; PDF tries PyPDF2 → PyMuPDF → optional Textract OCR."""
    fn = (filename or "resume.pdf").lower()
    if fn.endswith(".pdf"):
        notes = []
        text = ""
        try:
            text = _pypdf_extract(data)
        except Exception as e:
            notes.append(f"PyPDF2:{e}")
            text = ""
        if len(text) < MIN_PDF_TEXT_CHARS:
            try:
                t2 = _fitz_text_extract(data)
                if len(t2) > len(text):
                    text = t2
            except Exception as e:
                notes.append(f"PyMuPDF:{e}")
        if len(text) < MIN_PDF_TEXT_CHARS and ENABLE_TEXTRACT_OCR:
            try:
                t3 = _fitz_textract_ocr(data)
                if len(t3) > len(text):
                    text = t3
            except Exception as e:
                notes.append(f"Textract:{e}")
        if not text or len(text.strip()) < 5:
            deps_hint = _pdf_extraction_deps_missing_hint(notes)
            textract_hint = (
                ""
                if deps_hint
                else (
                    " Try setting ENABLE_TEXTRACT_OCR=1 with textract:DetectDocumentText on the Lambda role."
                    if not ENABLE_TEXTRACT_OCR
                    else ""
                )
            )
            raise ValueError(
                "Could not extract enough text from PDF (may be scanned)."
                + deps_hint
                + textract_hint
                + (" Details: " + "; ".join(notes) if notes else "")
            )
        return structure_resume_sections(text)
    if fn.endswith(".docx"):
        try:
            import docx
        except ImportError as e:
            raise RuntimeError("python-docx not installed in Lambda layer/package") from e
        document = docx.Document(io.BytesIO(data))
        text = "\n".join(p.text for p in document.paragraphs if p.text).strip()
        if not text:
            raise ValueError("Could not extract text from DOCX")
        return structure_resume_sections(text)
    raise ValueError("Unsupported file type. Use .pdf or .docx")


_SYNONYM_GROUPS = [
    ("communication", "communicating", "communicate", "communications"),
    ("stakeholder", "stakeholders"),
    ("analyze", "analytical", "analysis"),
    ("machine learning", "ml"),
    ("data science", "data scientist"),
    ("predict", "predictive"),
    ("collaborate", "collaboration", "collaborative"),
]

_SYNONYM_TO_CANON = {}
for grp in _SYNONYM_GROUPS:
    c = grp[0]
    for w in grp:
        _SYNONYM_TO_CANON[w.lower()] = c


def _simple_stem(word: str) -> str:
    w = word.lower()
    if len(w) < 4:
        return w
    for suf in ("ing", "ed", "es", "tion", "sions", "ness"):
        if w.endswith(suf) and len(w) > len(suf) + 2:
            return w[: -len(suf)]
    if w.endswith("s") and len(w) > 4:
        return w[:-1]
    return w


def _resume_stem_index(resume_lower: str):
    words = re.findall(r"[a-zA-Z0-9+]{2,}", resume_lower)
    stems = set()
    for w in words:
        stems.add(w.lower())
        stems.add(_simple_stem(w))
    return stems


def refine_keyword_lists(result, resume_text: str):
    """Remove false 'missing' keywords when resume clearly covers phrase (case, stemming, synonyms)."""
    if not resume_text:
        return
    rlow = resume_text.lower()
    stems = _resume_stem_index(rlow)
    matched = [m for m in (result.get("matchedKeywords") or []) if isinstance(m, str)]
    missing_in = [m for m in (result.get("missingKeywords") or []) if isinstance(m, str)]
    new_missing = []

    def _phrase_known(phrase: str) -> bool:
        pl = phrase.lower().strip()
        if not pl:
            return True
        if pl in rlow:
            return True
        toks = [t for t in re.split(r"[^\w+]+", pl) if t and len(t) > 1]
        if not toks:
            return False
        for tok in toks:
            canon = _SYNONYM_TO_CANON.get(tok, tok)
            ok = False
            if tok in rlow or _simple_stem(tok) in stems:
                ok = True
            for syn in _SYNONYM_GROUPS:
                if canon in syn or tok in syn:
                    if any(s in rlow for s in syn):
                        ok = True
                        break
            if not ok:
                return False
        return True

    for phrase in missing_in:
        if _phrase_known(phrase):
            if phrase not in matched:
                matched.append(phrase)
        else:
            new_missing.append(phrase)

    result["missingKeywords"] = new_missing
    result["matchedKeywords"] = matched


def _maybe_save_ats_history(
    user_id: str,
    provider_used: str,
    ats_result: dict,
    job_description: str,
    resume_file_name: str,
    resume_bytes: bytes | None = None,
    resume_text_for_s3_fallback: str | None = None,
):
    if not user_id:
        print("ATS history: skipped — no userId (sign in + send userId, or history is not saved)")
        return
    if not ats_result:
        return
    try:
        ms = int(time.time() * 1000)
        rid = f"{ms}#{uuid.uuid4().hex[:12]}"
        display_name = (resume_file_name or "").strip()
        upload_bytes = resume_bytes
        if upload_bytes is None and resume_text_for_s3_fallback and resume_text_for_s3_fallback.strip():
            if ATS_RESUME_S3_BUCKET:
                raw_txt = resume_text_for_s3_fallback.encode("utf-8")
                if len(raw_txt) > 1_048_576:
                    raw_txt = raw_txt[:1_048_576]
                upload_bytes = raw_txt
                display_name = "resume-from-builder.txt"
                print("ATS history S3: using UTF-8 text fallback (Resume Builder / resumeText-only path)")
        if not display_name:
            display_name = "resume.pdf" if resume_bytes else "resume-from-builder.txt"
        item = {
            "userId": user_id,
            "reportId": rid,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "provider": provider_used,
            "overallScore": int(ats_result.get("overallScore") or 0),
            "matchedKeywords": (ats_result.get("matchedKeywords") or [])[:50],
            "missingKeywords": (ats_result.get("missingKeywords") or [])[:50],
            "feedback": (ats_result.get("feedback") or [])[:20],
            "resumeFileName": display_name[:200],
            "jobDescriptionPreview": (job_description or "")[:500],
        }
        bkt, s3key = _upload_resume_to_s3(user_id, rid, upload_bytes, display_name)
        if bkt and s3key:
            url = _s3_object_https_url(bkt, s3key)
            item["resumeS3Bucket"] = bkt
            item["resumeS3Key"] = s3key
            item["resumeFileUrl"] = url
            # Stable object URL for DynamoDB/console; private buckets return 403 unless using a presigned URL from getAtsScoreHistory
            item["resume"] = url
            rgn = (os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "").strip()
            if rgn:
                item["resumeS3Region"] = rgn
        history_table.put_item(Item=item)
        print(
            f"ATS history: DynamoDB OK reportId={rid} userId={user_id[:8]}… "
            f"s3={'yes' if bkt else 'no'}"
        )
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "ResourceNotFoundException":
            print("ATS_HISTORY_TABLE missing; skip history write")
        else:
            print(f"_maybe_save_ats_history: {e}")


def get_user_llm_config(user_id):
    try:
        r = users_table.get_item(Key={"userId": user_id})
        item = r.get("Item")
        if not item:
            return None, None
        keys = item.get("llmApiKeys") or {}
        if not isinstance(keys, dict):
            keys = {}
        keys = {k: (v or "").strip() for k, v in keys.items() if (v or "").strip()}
        models = item.get("llmModels") or {}
        if not isinstance(models, dict):
            models = {}
        return keys, models
    except Exception as e:
        print(f"get_user_llm_config error: {e}")
        return None, None


def _call_openai(api_key, prompt, model=None):
    model = model or "gpt-4o-mini"
    data = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an ATS (Applicant Tracking System) scorer for engineering and tech architect roles. Respond only with valid JSON, no markdown or extra text."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    text = (out.get("choices") or [{}])[0].get("message", {}).get("content") or ""
    return text.strip()


def _call_openrouter(api_key, prompt, model=None):
    """OpenAI-compatible chat at openrouter.ai (any OpenRouter API key)."""
    model = model or OPENROUTER_DEFAULT_MODEL
    data = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an ATS (Applicant Tracking System) scorer for engineering and tech architect roles. Respond only with valid JSON, no markdown or extra text."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": OPENROUTER_HTTP_REFERER,
            "X-Title": "ProjectBazaar ATS Scorer",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    err = out.get("error")
    if err:
        msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
        raise RuntimeError(f"OpenRouter API: {msg}")
    text = (out.get("choices") or [{}])[0].get("message", {}).get("content") or ""
    return text.strip()


def _call_claude(api_key, prompt, model=None):
    model = model or "claude-3-haiku-20240307"
    data = json.dumps({
        "model": model,
        "max_tokens": 2000,
        "messages": [
            {"role": "user", "content": prompt},
        ],
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
    with urllib.request.urlopen(req, timeout=90) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    for block in (out.get("content") or []):
        if block.get("type") == "text":
            return (block.get("text") or "").strip()
    return ""


def _call_gemini(api_key, prompt, model=None):
    """Call Gemini generateContent; tries JSON MIME type first, then plain text."""
    model = model or "gemini-2.0-flash"
    fallback_model = "gemini-2.0-flash"
    to_try = [model] if model == fallback_model else [model, fallback_model]

    for try_model in to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{try_model}:generateContent?key={api_key}"
        for json_mode in (True, False):
            # Keep output modest — large payloads slow Gemini and risk API Gateway ~30s HTTP API limit
            gen_config = {"temperature": 0.3, "maxOutputTokens": 2048}
            if json_mode:
                gen_config["responseMimeType"] = "application/json"

            payload = {
                "systemInstruction": {
                    "parts": [{
                        "text": "You are an ATS resume scorer. Reply with a single JSON object only, matching the schema requested in the user message. No markdown fences.",
                    }],
                },
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": gen_config,
            }
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url, data=data, headers={"Content-Type": "application/json"}, method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=25) as resp:
                    out = json.loads(resp.read().decode("utf-8"))
                err = out.get("error")
                if err:
                    msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
                    raise RuntimeError(f"Gemini API: {msg}")
                cands = out.get("candidates") or []
                if not cands:
                    pf = out.get("promptFeedback") or {}
                    br = pf.get("blockReason")
                    raise RuntimeError(
                        f"Gemini returned no output (blocked or safety). blockReason={br}. "
                        "Try shorter JD/resume or another model."
                    )
                for part in cands[0].get("content", {}).get("parts") or []:
                    if "text" in part:
                        return part["text"].strip()
                return ""
            except urllib.error.HTTPError as e:
                err_body = ""
                try:
                    err_body = e.read().decode("utf-8", errors="replace")
                except Exception:
                    pass
                if json_mode and e.code in (400, 404):
                    continue
                if e.code == 404 and try_model != fallback_model:
                    break
                print(f"Gemini HTTPError {e.code}: {err_body[:500]}")
                raise RuntimeError(
                    f"Gemini API error ({e.code}): {err_body[:400] or e.reason}"
                ) from e
    return ""


def build_ats_prompt(resume_text, job_description):
    w = WEIGHTS
    return f"""You are an ATS (Applicant Tracking System) scorer for engineering and tech architect roles.

TASK:
1. Parse the resume into sections: skills, experience, education, achievements, formatting/clarity, and any location/soft skills.
2. Compare the resume to the job description. Extract important keywords from the JD (e.g. AWS, Agile, Python, system design).
3. Score the resume from 0 to 100 using EXACTLY these weights (they sum to 100):
   - Skills match (keyword match + depth): {w['skillsMatch']}%
   - Experience (relevance, years, impact): {w['experience']}%
   - Education (relevance to role): {w['education']}%
   - Formatting (clarity, structure, readability): {w['formatting']}%
   - Achievements (quantified results, leadership): {w['achievements']}%
   - Location/soft (if mentioned in JD) and soft skills: {w['locationAndSoft']}%

4. List matched keywords from the JD that appear in the resume.
5. List important JD keywords that are missing or weak in the resume.
6. Give 2-4 short, actionable feedback sentences.

Respond with ONLY a single JSON object (no markdown, no code block), with these exact keys:
- "overallScore": number 0-100
- "breakdown": object with keys "skillsMatch", "experience", "education", "formatting", "achievements", "locationAndSoft" (each a number 0-100)
- "matchedKeywords": array of strings
- "missingKeywords": array of strings
- "feedback": array of strings (2-4 short actionable sentences; required, use this exact key name)

RESUME:
{resume_text[:6000]}

JOB DESCRIPTION:
{job_description[:4000]}
"""


def parse_llm_json(raw):
    s = (raw or "").strip()
    if s.startswith("```"):
        lines = s.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        s = "\n".join(lines)
    return json.loads(s)


def _coerce_feedback_list(val):
    """Normalize model output to a list of strings for atsResult.feedback and DynamoDB history."""
    if val is None:
        return []
    if isinstance(val, str):
        s = val.strip()
        if not s:
            return []
        lines = [ln.strip() for ln in s.splitlines() if ln.strip()]
        if len(lines) > 1:
            return lines[:20]
        parts = [p.strip() for p in re.split(r"(?<=[.!?])\s+", s) if p.strip() and len(p.strip()) > 2]
        return (parts if len(parts) > 1 else [s])[:20]
    if isinstance(val, list):
        out = []
        for x in val:
            if isinstance(x, str) and x.strip():
                out.append(x.strip())
            elif isinstance(x, dict):
                piece = (
                    x.get("text")
                    or x.get("message")
                    or x.get("fix")
                    or x.get("suggestion")
                    or x.get("item")
                )
                if isinstance(piece, str) and piece.strip():
                    out.append(piece.strip())
        return out[:20]
    return []


def normalize_ats_result(result):
    result.setdefault("overallScore", 0)
    result.setdefault("breakdown", {})
    result.setdefault("matchedKeywords", [])
    result.setdefault("missingKeywords", [])
    result.setdefault("feedback", [])
    try:
        score = int(round(float(result["overallScore"])))
        result["overallScore"] = max(0, min(100, score))
    except (TypeError, ValueError):
        result["overallScore"] = 0

    # LLMs often omit "feedback" or use other keys; history + UI need feedback[].
    fb = _coerce_feedback_list(result.get("feedback"))
    if not fb:
        for key in (
            "criticalFixes",
            "critical_fixes",
            "suggestions",
            "improvements",
            "actionItems",
            "fixes",
            "recommendations",
        ):
            fb = _coerce_feedback_list(result.get(key))
            if fb:
                break
    result["feedback"] = fb
    return result


def run_byok_provider(body):
    provider, api_key, model = _extract_byok_credentials(body)
    if not provider or not api_key:
        return None

    job_description = _field_str(body, "jobDescription", "job_description")
    if not job_description:
        return response(400, {"success": False, "message": "jobDescription is required"})

    resume_text = _field_str(body, "resumeText", "resume_text")
    b64 = body.get("resumeBase64") or body.get("resume_base64")
    file_name = _field_str(body, "resumeFileName", "resume_file_name")
    if not file_name:
        file_name = "resume.pdf" if b64 else "resume-from-builder.txt"
    resume_bytes = None

    if b64:
        try:
            resume_bytes = base64.b64decode(b64, validate=False)
            if len(resume_bytes) > 6 * 1024 * 1024:
                return response(400, {"success": False, "message": "Resume file too large (max ~6MB)."})
            if not resume_text:
                resume_text = extract_text_from_bytes(resume_bytes, file_name)
        except Exception as e:
            print(f"resume extract error: {e}")
            return response(400, {"success": False, "message": f"Could not read resume file: {str(e)}"})

    if not resume_text:
        return response(400, {"success": False, "message": "Provide resumeText or resumeBase64 + resumeFileName (.pdf / .docx)."})

    prompt = build_ats_prompt(resume_text, job_description)

    try:
        if provider == "openai":
            raw = _call_openai(api_key, prompt, model or "gpt-4o-mini")
        elif provider == "openrouter":
            raw = _call_openrouter(api_key, prompt, model or OPENROUTER_DEFAULT_MODEL)
        elif provider == "anthropic":
            sys_prompt = "You are an ATS scorer for engineering roles. Respond only with valid JSON, no markdown."
            full_prompt = f"{sys_prompt}\n\n{prompt}"
            raw = _call_claude(api_key, full_prompt, model or "claude-3-haiku-20240307")
        else:
            raw = _call_gemini(api_key, prompt, model or "gemini-2.0-flash")
    except Exception as e:
        print(f"BYOK {provider} error: {e}")
        return response(502, {"success": False, "message": str(e)})

    try:
        result = parse_llm_json(raw)
    except json.JSONDecodeError as e:
        print(f"ATS JSON parse error: {e} raw[:200]={raw[:200]!r}")
        return response(500, {"success": False, "message": f"Invalid JSON from {provider}. Try again with a different model."})

    normalize_ats_result(result)
    refine_keyword_lists(result, resume_text)
    uid_hist = _field_str(body, "userId", "user_id")
    _maybe_save_ats_history(
        uid_hist, provider, result, job_description, file_name, resume_bytes, resume_text
    )
    return response(200, {"success": True, "atsResult": result})


def run_dynamodb_user_flow(body):
    user_id = _field_str(body, "userId", "user_id")
    resume_text = _field_str(body, "resumeText", "resume_text")
    b64 = body.get("resumeBase64") or body.get("resume_base64")
    file_name = _field_str(body, "resumeFileName", "resume_file_name")
    if not file_name:
        file_name = "resume.pdf" if body.get("resumeBase64") or body.get("resume_base64") else "resume-from-builder.txt"
    job_description = _field_str(body, "jobDescription", "job_description")
    requested_provider = _normalize_provider(_field_str(body, "provider", "llmProvider", "llm_provider"))
    requested_provider = "claude" if requested_provider == "anthropic" else requested_provider
    resume_bytes = None

    if not user_id:
        return response(400, {"success": False, "message": "userId is required (or send provider + API key for BYOK)."})
    if not job_description:
        return response(400, {"success": False, "message": "jobDescription is required"})
    if b64:
        try:
            resume_bytes = base64.b64decode(b64, validate=False)
            if len(resume_bytes) > 6 * 1024 * 1024:
                return response(400, {"success": False, "message": "Resume file too large (max ~6MB)."})
            if not resume_text:
                resume_text = extract_text_from_bytes(resume_bytes, file_name)
        except Exception as e:
            print(f"resume extract error: {e}")
            return response(400, {"success": False, "message": f"Could not read resume file: {str(e)}"})
    if not resume_text:
        return response(400, {"success": False, "message": "Provide resumeText or resumeBase64 + resumeFileName (.pdf / .docx)."})

    keys, models = get_user_llm_config(user_id)
    if not keys:
        return response(403, {"success": False, "message": "No LLM API key found. Add a key in Settings or use provider + API key in the request."})
    models = models or {}

    prompt = build_ats_prompt(resume_text, job_description)
    raw = None
    last_error = None
    providers_tried = []

    _all_providers = ("openai", "openrouter", "claude", "gemini")
    provider_order = (
        [requested_provider] if requested_provider in _all_providers else ["openai", "claude", "gemini", "openrouter"]
    )
    chosen_provider = None
    for provider in provider_order:
        api_key = keys.get(provider)
        if not api_key:
            continue
        providers_tried.append(provider)
        model = models.get(provider)
        try:
            if provider == "openai":
                raw = _call_openai(api_key, prompt, model)
            elif provider == "openrouter":
                raw = _call_openrouter(api_key, prompt, model or OPENROUTER_DEFAULT_MODEL)
            elif provider == "claude":
                sys_prompt = "You are an ATS scorer for engineering roles. Respond only with valid JSON, no markdown."
                full_prompt = f"{sys_prompt}\n\n{prompt}"
                raw = _call_claude(api_key, full_prompt, model)
            else:
                raw = _call_gemini(api_key, prompt, model)
            if raw:
                chosen_provider = provider
                break
        except Exception as e:
            last_error = str(e)
            print(f"ATS {provider} error: {e}")
            continue

    if not raw:
        error_msg = "Could not get ATS score from any configured LLM."
        if providers_tried:
            error_msg += f" Tried: {', '.join(providers_tried)}."
        if last_error:
            error_msg += f" Last error: {last_error}"
        return response(500, {"success": False, "message": error_msg})

    try:
        result = parse_llm_json(raw)
    except json.JSONDecodeError:
        return response(500, {"success": False, "message": "Invalid response from scorer. Please try again."})

    normalize_ats_result(result)
    refine_keyword_lists(result, resume_text)
    if chosen_provider == "claude":
        hist_provider = "anthropic"
    elif chosen_provider == "openrouter":
        hist_provider = "openrouter"
    else:
        hist_provider = chosen_provider or "openai"
    _maybe_save_ats_history(
        user_id, hist_provider, result, job_description, file_name, resume_bytes, resume_text
    )
    return response(200, {"success": True, "atsResult": result})


def lambda_handler(event, context):
    try:
        if _http_method(event) == "OPTIONS":
            return response(200, {})

        body = _parse_request_body(event)

        byok_resp = run_byok_provider(body)
        if byok_resp is not None:
            return byok_resp

        return run_dynamodb_user_flow(body)

    except json.JSONDecodeError:
        return response(400, {"success": False, "message": "Invalid JSON body"})
    except Exception as e:
        print(f"ATS Lambda error: {e}\n{traceback.format_exc()}")
        return response(500, {"success": False, "message": str(e)})
