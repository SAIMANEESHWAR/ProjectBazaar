"""
Orchestrates: extract text → structured JSON → keyword fix → optional LLM → LaTeX → PDF → optional S3.

Invoked from fix_resume_handler.lambda_handler (dedicated Lambda).
"""

from __future__ import annotations

import base64
import json
import os
import re
import uuid
import urllib.parse
from typing import Any

# Optional AWS deps (local dev may not have boto3/botocore installed).
try:
    import boto3  # type: ignore
    from botocore.exceptions import ClientError  # type: ignore
except Exception:  # pragma: no cover
    boto3 = None  # type: ignore
    ClientError = Exception  # type: ignore

from resume_fix_engine import (
    apply_missing_keywords,
    enhance_with_optional_llm,
    map_fields_with_optional_llm,
    render_resume_html_with_llm,
    render_resume_data_with_llm,
    structured_to_preview_text,
)

# Reuse same bucket as ATS history when set; separate key prefix for fixed PDFs.
FIX_RESUME_S3_PREFIX = (os.environ.get("ATS_FIXED_RESUME_PREFIX") or "ats-fixed-resume/").strip()
if FIX_RESUME_S3_PREFIX and not FIX_RESUME_S3_PREFIX.endswith("/"):
    FIX_RESUME_S3_PREFIX += "/"

ATS_RESUME_S3_BUCKET = (os.environ.get("ATS_RESUME_S3_BUCKET") or "").strip()

# API Gateway + Lambda payload limits (~6MB). Base64 inflates PDF ~4/3; stay safely under.
_MAX_PDF_BASE64_RESPONSE_CHARS = int(os.environ.get("FIX_RESUME_MAX_PDF_B64_CHARS", "4500000"))

# On Lambda, TeX is almost never installed — skip subprocess unless explicitly enabled.
_ENABLE_LATEX_PDF = os.environ.get("ENABLE_LATEX_PDF", "").lower() in ("1", "true", "yes")

# Full structured JSON can be huge and exceed API Gateway / Lambda response limits → 502 "Internal Server Error".
_RETURN_IMPROVED_RESUME_OBJECT = os.environ.get("FIX_RESUME_RETURN_IMPROVED_JSON", "").lower() in (
    "1",
    "true",
    "yes",
)


def _field_str(data: dict[str, Any], *keys: str) -> str:
    for k in keys:
        v = data.get(k)
        if v is None:
            continue
        s = str(v).strip()
        if s:
            return s
    return ""


def _normalize_missing_keywords(raw: Any) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        parts = re.split(r"[,;\n]+", raw)
        return [p.strip() for p in parts if p.strip()]
    if isinstance(raw, list):
        out: list[str] = []
        for x in raw:
            if isinstance(x, str) and x.strip():
                out.append(x.strip())
            elif isinstance(x, dict):
                kw = str(x.get("keyword") or x.get("term") or "").strip()
                if kw:
                    out.append(kw)
        return out
    return []


def _upload_fixed_pdf(user_id: str, pdf_bytes: bytes) -> tuple[str | None, str | None]:
    """Returns (https_url, key) or (None, None)."""
    if not ATS_RESUME_S3_BUCKET or not pdf_bytes or boto3 is None:
        return None, None
    safe_user = re.sub(r"[^a-zA-Z0-9._-]", "_", (user_id or "anon")[:64])[:64] or "anon"
    rid = uuid.uuid4().hex[:12]
    key = f"{FIX_RESUME_S3_PREFIX}{safe_user}/fixed_{rid}.pdf"
    try:
        region = (os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "ap-south-2").strip()
        boto3.client("s3", region_name=region).put_object(
            Bucket=ATS_RESUME_S3_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
            ServerSideEncryption="AES256",
        )
        enc_key = urllib.parse.quote(key, safe="/")
        url = f"https://{ATS_RESUME_S3_BUCKET}.s3.{region}.amazonaws.com/{enc_key}"
        return url, key
    except ClientError as e:
        print(f"fix_resume S3 upload ClientError: {e}")
        return None, None
    except Exception as e:
        print(f"fix_resume S3 upload error: {e}")
        return None, None


def run_fix_resume_pipeline(
    body: dict[str, Any],
    *,
    extract_text_from_bytes,
) -> dict[str, Any]:
    """
    Core implementation. extract_text_from_bytes is injected to avoid circular imports
    with ats_resume_scorer.extract_text_from_bytes.
    """
    missing = _normalize_missing_keywords(body.get("missingKeywords") or body.get("missing_keywords"))
    file_name = _field_str(body, "resumeFileName", "resume_file_name") or "resume.pdf"
    resume_text = _field_str(body, "resumeText", "resume_text")
    b64 = body.get("resumeBase64") or body.get("resume_base64")
    user_id = _field_str(body, "userId", "user_id")

    if not missing:
        return {"success": False, "message": "missingKeywords is required and must be a non-empty list."}

    resume_bytes: bytes | None = None
    if b64:
        try:
            resume_bytes = base64.b64decode(b64, validate=False)
            if len(resume_bytes) > 6 * 1024 * 1024:
                return {"success": False, "message": "Resume file too large (max ~6MB)."}
            if not resume_text:
                resume_text = extract_text_from_bytes(resume_bytes, file_name)
        except Exception as e:
            return {"success": False, "message": f"Could not read resume file: {e}"}

    if not resume_text or not str(resume_text).strip():
        return {"success": False, "message": "Provide resumeText or resumeBase64 + resumeFileName (.pdf / .docx)."}

    # Resume JSON render mode: LLM returns the `resume_preview.html` data object for our template renderer.
    if body.get("useLlmRenderResumeJson"):
        try:
            resume_data, added = render_resume_data_with_llm(
                resume_text,
                missing,
                {
                    "provider": _field_str(body, "provider", "llmProvider"),
                    "apiKey": _field_str(body, "apiKey", "api_key", "llmApiKey"),
                    "model": _field_str(body, "model", "llmModel"),
                },
                user_id=user_id or None,
            )
        except Exception as e:
            return {"success": False, "message": f"AI resume JSON render failed: {e}"}

        # Text-layer PDF (selectable); browser Print→PDF from HTML is often rasterized.
        pdf_bytes: bytes | None = None
        pdf_err: str | None = None
        pdf_note: str | None = None
        try:
            from resume_fix_pdf_simple import build_simple_pdf_from_resume_data

            pdf_bytes = build_simple_pdf_from_resume_data(resume_data)
        except Exception as pdf_ex:
            print(f"resume_data pdf: {pdf_ex}")
            pdf_bytes = None
            pdf_err = str(pdf_ex)[:500]
        if pdf_bytes:
            pdf_note = (
                "Selectable text PDF (simple layout)—use this for ATS re-uploads, "
                "not browser Print → Save as PDF (often image-only)."
            )
            pdf_err = None

        pdf_url: str | None = None
        s3_key: str | None = None
        if pdf_bytes:
            pdf_url, s3_key = _upload_fixed_pdf(user_id, pdf_bytes)

        out: dict[str, Any] = {
            "success": True,
            "resumeData": resume_data,
            "addedKeywords": added,
            "pdfAvailable": bool(pdf_bytes),
            "pdfUrl": pdf_url,
            "pdfS3Key": s3_key,
        }
        if pdf_note:
            out["pdfNote"] = pdf_note
        if pdf_bytes and not pdf_url:
            b64 = base64.b64encode(pdf_bytes).decode("ascii")
            if len(b64) <= _MAX_PDF_BASE64_RESPONSE_CHARS:
                out["pdfBase64"] = b64
                out["pdfFileName"] = "fixed-resume.pdf"
            else:
                out["pdfError"] = (
                    "PDF is too large to return in the API response. Set environment variable "
                    "ATS_RESUME_S3_BUCKET on the Fix Resume Lambda and grant s3:PutObject so the file can be uploaded."
                )
                out["pdfAvailable"] = False
        if not pdf_bytes and pdf_err:
            out["pdfError"] = pdf_err[:500]

        return out

    # HTML render mode: LLM returns the final Garamond HTML document for preview + browser print.
    if body.get("useLlmRenderHtml"):
        try:
            rendered = render_resume_html_with_llm(
                resume_text,
                missing,
                {
                    "provider": _field_str(body, "provider", "llmProvider"),
                    "apiKey": _field_str(body, "apiKey", "api_key", "llmApiKey"),
                    "model": _field_str(body, "model", "llmModel"),
                },
                user_id=user_id or None,
            )
        except Exception as e:
            return {"success": False, "message": f"AI HTML render failed: {e}"}
        # Deterministic cap to keep UI consistent; HTML may optionally highlight these.
        added = missing[:12]
        return {"success": True, "renderedHtml": rendered, "addedKeywords": added, "pdfAvailable": False}

    # 1) AI-only parse/map résumé text into the preview JSON shape.
    if not body.get("useLlmMapFields"):
        return {
            "success": False,
            "message": "AI mapping is required for Fix My Resume. Enable AI map fields and ensure a saved provider key exists.",
        }
    try:
        improved = map_fields_with_optional_llm(
            {},
            resume_text,
            {
                "useLlmMapFields": True,
                "provider": _field_str(body, "provider", "llmProvider"),
                "apiKey": _field_str(body, "apiKey", "api_key", "llmApiKey"),
                "model": _field_str(body, "model", "llmModel"),
            },
            user_id=user_id or None,
        )
    except Exception as llm_err:
        return {"success": False, "message": f"AI parsing failed: {llm_err}"}

    # 2) Deterministic keyword injection (no LLM).
    improved, added_keywords = apply_missing_keywords(improved, missing)

    # 3) Optional single LLM pass (OpenAI / OpenRouter only) — off unless requested.
    llm_cfg = body.get("fixResumeLlm") if isinstance(body.get("fixResumeLlm"), dict) else None
    if body.get("useLlmEnhance"):
        llm_cfg = {
            "useLlmEnhance": True,
            "provider": _field_str(body, "provider", "llmProvider"),
            "apiKey": _field_str(body, "apiKey", "api_key", "llmApiKey"),
            "model": _field_str(body, "model", "llmModel"),
        }
    try:
        improved = enhance_with_optional_llm(improved, added_keywords, llm_cfg)
    except Exception as llm_err:
        print(f"optional LLM step failed (using keyword-only result): {llm_err}")

    preview_text = structured_to_preview_text(improved)

    # 4) PDF: stdlib text PDF by default (no third-party PDF lib). LaTeX only if ENABLE_LATEX_PDF=1.
    pdf_bytes: bytes | None = None
    pdf_err: str | None = None
    pdf_note: str | None = None
    if _ENABLE_LATEX_PDF:
        from resume_fix_latex import build_latex_document, compile_latex_to_pdf

        tex = build_latex_document(improved)
        pdf_bytes, pdf_err = compile_latex_to_pdf(tex)
    if not pdf_bytes:
        try:
            from resume_fix_pdf_simple import build_simple_pdf_bytes

            pdf_bytes = build_simple_pdf_bytes(improved)
        except Exception as pdf_ex:
            print(f"resume_fix_pdf_simple failed: {pdf_ex}")
            pdf_bytes = None
            pdf_err = str(pdf_ex)[:500]
        if pdf_bytes:
            pdf_note = (
                "PDF is a simple text layout (stdlib). Set ENABLE_LATEX_PDF=1 when TeX is installed for LaTeX output."
            )
            pdf_err = None

    pdf_url: str | None = None
    s3_key: str | None = None
    if pdf_bytes:
        pdf_url, s3_key = _upload_fixed_pdf(user_id, pdf_bytes)
        if not pdf_url:
            pass

    out: dict[str, Any] = {
        "success": True,
        "addedKeywords": added_keywords,
        "previewText": preview_text,
        "pdfUrl": pdf_url,
        "pdfS3Key": s3_key,
        "pdfAvailable": bool(pdf_bytes),
    }
    if _RETURN_IMPROVED_RESUME_OBJECT:
        out["improvedResume"] = improved
    else:
        # Default: include structured JSON for in-app template preview (skip if huge / serial fails).
        try:
            dumped = json.dumps(improved, ensure_ascii=False, default=str).encode("utf-8")
            if len(dumped) <= 480_000:
                out["improvedResume"] = improved
        except Exception as ex:
            print(f"fix_resume: improvedResume not attached: {ex}")
    if pdf_note:
        out["pdfNote"] = pdf_note
    if pdf_bytes and not pdf_url:
        b64 = base64.b64encode(pdf_bytes).decode("ascii")
        if len(b64) <= _MAX_PDF_BASE64_RESPONSE_CHARS:
            out["pdfBase64"] = b64
            out["pdfFileName"] = "fixed-resume.pdf"
        else:
            out["pdfError"] = (
                "PDF is too large to return in the API response. Set environment variable "
                "ATS_RESUME_S3_BUCKET on the Fix Resume Lambda and grant s3:PutObject so the file can be uploaded."
            )
            out["pdfAvailable"] = False
    if not pdf_bytes and pdf_err:
        out["pdfError"] = pdf_err[:500]

    return out
