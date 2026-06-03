"""
Fix My Resume Lambda (separate from ATS scorer).

POST JSON body:
- resumeBase64 + resumeFileName (or resumeText)
- missingKeywords: string[]
- userId: optional (S3 key prefix)
- useLlmEnhance, provider, apiKey, model: optional polish pass (OpenAI / OpenRouter)

Response: addedKeywords, previewText, pdfUrl | pdfBase64, pdfAvailable, pdfError?, improvedResume (structured JSON
for in-app template preview when serial size ≤ ~480KB; set FIX_RESUME_RETURN_IMPROVED_JSON=1 to always attach even
if larger).
"""

from __future__ import annotations

import base64
import json
import traceback


def response(status, body):
    try:
        body_str = json.dumps(body, ensure_ascii=False, default=str)
    except Exception as enc_err:
        body_str = json.dumps(
            {"success": False, "message": f"Response encoding failed: {enc_err}"},
            ensure_ascii=False,
        )
    return {
        "statusCode": status,
        "isBase64Encoded": False,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
            "Access-Control-Allow-Methods": "POST,OPTIONS",
        },
        "body": body_str,
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
        print(f"fix_resume _parse_request_body: {e}")
    return {}


def lambda_handler(event, context):
    try:
        if _http_method(event) == "OPTIONS":
            return response(200, {})

        # Lazy import so cold INIT stays small (ReportLab/PyMuPDF load only on first invoke).
        from resume_fix_pipeline import run_fix_resume_pipeline
        from resume_text_extract import extract_text_from_bytes

        body = _parse_request_body(event)
        result = run_fix_resume_pipeline(body, extract_text_from_bytes=extract_text_from_bytes)
        if not result.get("success"):
            return response(400, result)
        return response(200, result)
    except Exception as e:
        print(f"fix_resume_handler error: {e}\n{traceback.format_exc()}")
        return response(500, {"success": False, "message": str(e), "errorType": type(e).__name__})
