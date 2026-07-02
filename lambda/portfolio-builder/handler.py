"""
Portfolio Builder v2 Lambda
----------------------------
Actions: getTemplates, generateFromResume, previewPortfolio, deployPortfolio,
         getPortfolioHistory, deletePortfolio
"""

from __future__ import annotations

import base64
import json
import os
import sys
import uuid
from datetime import datetime
from typing import Any, Dict

# Parent lambda/ for shared feature_entitlement
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from feature_entitlement import check_entitlement_or_error, consume_feature_use

from history import delete_portfolio_from_history, get_portfolio_history, save_portfolio_to_history
from llm_enrich import enrich_resume_to_portfolio
from resume_extract import extract_text_from_resume
from templates import TEMPLATE_IDS, generate_portfolio_html, get_template_list
from vercel_deploy import deploy_to_vercel


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With",
        "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
    }

    if event.get("httpMethod") == "OPTIONS" or event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    # Browser health check (GET with no body)
    method = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or ""
    ).upper()
    if method == "GET" and "body" not in event:
        return _ok(
            headers,
            {
                "message": "Portfolio Builder API is running. POST JSON with action field.",
                "actions": [
                    "getTemplates",
                    "generateFromResume",
                    "previewPortfolio",
                    "deployPortfolio",
                    "getPortfolioHistory",
                    "deletePortfolio",
                ],
                "templates": get_template_list(),
            },
        )

    try:
        body = event
        if "body" in event:
            raw = event["body"]
            if isinstance(raw, str):
                body = json.loads(raw) if raw else {}
            elif isinstance(raw, dict):
                body = raw

        action = body.get("action", "")
        print(f"portfolio-builder action={action}")

        if action == "getTemplates":
            return _ok(headers, {"templates": get_template_list()})
        if action == "generateFromResume":
            return handle_generate_from_resume(body, headers)
        if action == "previewPortfolio":
            return handle_preview(body, headers)
        if action == "deployPortfolio":
            return handle_deploy(body, headers)
        if action == "getPortfolioHistory":
            return handle_history(body, headers)
        if action == "deletePortfolio":
            return handle_delete(body, headers)

        return _err(
            headers,
            f"Invalid action: {action}. Valid: getTemplates, generateFromResume, previewPortfolio, "
            "deployPortfolio, getPortfolioHistory, deletePortfolio",
        )
    except Exception as e:
        print(f"portfolio-builder error: {e}")
        import traceback

        traceback.print_exc()
        return _err(headers, str(e))


def handle_generate_from_resume(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    user_id = (body.get("userId") or "").strip()
    if not user_id:
        return _err(headers, "userId is required")

    template_id = body.get("templateId", "editorial")
    if template_id not in TEMPLATE_IDS:
        return _err(headers, f"Invalid template: {template_id}")

    file_b64 = body.get("fileContent")
    if not file_b64:
        return _err(headers, "No resume file provided")

    file_name = body.get("fileName", "resume.pdf")
    file_type = body.get("fileType", "application/pdf")
    user_email = body.get("userEmail", "")

    file_bytes = base64.b64decode(file_b64)
    resume_text = extract_text_from_resume(file_bytes, file_type, file_name)
    if len(resume_text) < 50:
        return _err(
            headers,
            "Could not extract text from resume. "
            "Your PDF is valid but Lambda needs PDF libraries (PyPDF2 + pdfminer.six). "
            "Add a Lambda Layer or redeploy with requirements.txt bundled. "
            "Alternatively upload a DOCX file.",
        )

    try:
        portfolio_data, provider = enrich_resume_to_portfolio(
            resume_text, user_id, template_id, user_email
        )
    except ValueError as ve:
        return _err(headers, str(ve))
    except Exception as e:
        print(f"LLM enrich failed: {e}")
        return _err(headers, f"AI content generation failed: {e}")

    extracted = resume_text[:5000]
    if len(resume_text) > 5000:
        extracted += f"\n\n... [{len(resume_text)} chars total]"

    return _ok(
        headers,
        {
            "portfolioData": portfolio_data,
            "extractedText": extracted,
            "provider": provider,
            "templateId": template_id,
        },
    )


def handle_preview(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    portfolio_data = body.get("portfolioData")
    template_id = body.get("templateId", "editorial")
    if not portfolio_data:
        return _err(headers, "No portfolio data provided")
    if template_id not in TEMPLATE_IDS:
        return _err(headers, f"Invalid template: {template_id}")
    html = generate_portfolio_html(portfolio_data, template_id)
    return _ok(headers, {"html": html, "templateId": template_id})


def handle_deploy(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    user_id = body.get("userId", f"user_{int(datetime.now().timestamp())}")
    if user_id and not str(user_id).startswith("user_"):
        allowed, ent_err = check_entitlement_or_error(str(user_id).strip(), "portfolio")
        if not allowed:
            return _err(headers, ent_err or "Trial limit reached")

    portfolio_data = body.get("portfolioData")
    template_id = body.get("templateId", "editorial")
    user_email = body.get("userEmail", "")
    file_name = body.get("fileName", "resume.pdf")

    if not portfolio_data:
        return _err(headers, "No portfolio data provided")
    if template_id not in TEMPLATE_IDS:
        return _err(headers, f"Invalid template: {template_id}")

    deployment = deploy_to_vercel(portfolio_data, str(user_id), template_id)
    if not deployment.get("success"):
        return _err(headers, deployment.get("error", "Deployment failed"))

    portfolio_id = str(uuid.uuid4())
    save_portfolio_to_history(
        portfolio_id,
        str(user_id),
        user_email,
        portfolio_data,
        template_id,
        deployment["liveUrl"],
        file_name,
    )

    if user_id and not str(user_id).startswith("user_"):
        consume_feature_use(str(user_id).strip(), "portfolio")

    return _ok(
        headers,
        {
            "portfolioId": portfolio_id,
            "liveUrl": deployment["liveUrl"],
            "previewUrl": deployment.get("previewUrl", deployment["liveUrl"]),
            "templateId": template_id,
        },
    )


def handle_history(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    user_id = body.get("userId")
    if not user_id:
        return _err(headers, "userId is required")
    return _ok(headers, {"history": get_portfolio_history(str(user_id))})


def handle_delete(body: Dict[str, Any], headers: Dict[str, str]) -> Dict[str, Any]:
    user_id = body.get("userId")
    portfolio_id = body.get("portfolioId")
    if not user_id or not portfolio_id:
        return _err(headers, "userId and portfolioId are required")
    ok = delete_portfolio_from_history(str(user_id), str(portfolio_id))
    return _ok(headers, {"success": ok, "message": "Deleted" if ok else "Failed to delete"})


def _ok(headers: Dict[str, str], data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({"success": True, **data}),
    }


def _err(headers: Dict[str, str], message: str) -> Dict[str, Any]:
    return {
        "statusCode": 400,
        "headers": headers,
        "body": json.dumps({"success": False, "error": message}),
    }
