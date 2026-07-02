"""LLM-powered resume → portfolio JSON enrichment using saved ATS active provider."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any, Dict, Optional, Tuple

from regex_fallback import extract_portfolio_data

OPENROUTER_DEFAULT_MODEL = (os.environ.get("OPENROUTER_DEFAULT_MODEL") or "openai/gpt-4o-mini").strip()
OPENROUTER_HTTP_REFERER = (os.environ.get("OPENROUTER_HTTP_REFERER") or "https://codexcareer.com").strip()

USERS_TABLE_NAME = os.environ.get("USERS_TABLE", "Users")

try:
    import boto3

    dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "ap-south-2"))
    users_table = dynamodb.Table(USERS_TABLE_NAME)
except Exception:
    users_table = None


def get_user_llm_config(user_id: str) -> Tuple[Optional[Dict[str, str]], Optional[Dict[str, str]], Optional[str]]:
    if users_table is None or not user_id:
        return None, None, None
    try:
        r = users_table.get_item(Key={"userId": user_id})
        item = r.get("Item") or {}
        keys = item.get("llmApiKeys") or {}
        if not isinstance(keys, dict):
            keys = {}
        keys = {k: (v or "").strip() for k, v in keys.items() if (v or "").strip()}
        models = item.get("llmModels") or {}
        if not isinstance(models, dict):
            models = {}
        active = (item.get("atsActiveProvider") or "").strip().lower() or None
        return keys, models, active
    except Exception as e:
        print(f"get_user_llm_config: {e}")
        return None, None, None


def _settings_to_provider(settings_id: str) -> Optional[str]:
    p = (settings_id or "").lower()
    if p == "openai":
        return "openai"
    if p == "gemini":
        return "gemini"
    if p in ("claude", "anthropic"):
        return "anthropic"
    if p == "openrouter":
        return "openrouter"
    return None


def resolve_provider_and_key(user_id: str) -> Tuple[str, str, str]:
    keys, models, active_settings_id = get_user_llm_config(user_id)
    if not keys:
        raise ValueError("Add an API key in Settings and set your ATS active provider.")

    provider = _settings_to_provider(active_settings_id or "")
    if not provider:
        for candidate in ("openai", "gemini", "claude", "openrouter"):
            if keys.get(candidate):
                provider = _settings_to_provider(candidate)
                break
    if not provider:
        raise ValueError("Add an API key in Settings and set your ATS active provider.")

    settings_key = "claude" if provider == "anthropic" else provider
    api_key = keys.get(settings_key, "")
    if not api_key:
        raise ValueError(
            f"No API key saved for active provider ({settings_key}). "
            "Open Settings → AI & LLM API keys."
        )

    model = (models or {}).get(settings_key, "") or ""
    return provider, api_key, model


def enrich_resume_to_portfolio(
    resume_text: str,
    user_id: str,
    template_id: str,
    user_email: str = "",
) -> Tuple[Dict[str, Any], str]:
    provider, api_key, model = resolve_provider_and_key(user_id)
    prompt = _build_prompt(resume_text, template_id)
    raw = _call_llm(provider, api_key, prompt, model)
    data = _parse_llm_json(raw)
    if data:
        data = _normalize_portfolio_data(data, user_email)
        return data, provider
    fallback = extract_portfolio_data(resume_text, user_email)
    return fallback, f"{provider}_fallback"


def _build_prompt(resume_text: str, template_id: str) -> str:
    style_hint = {
        "aurora": "modern developer portfolio — confident, technical, concise",
        "slate": "minimal designer portfolio — elegant, refined prose",
        "momentum": "creative agency portfolio — bold, energetic copy",
    }.get(template_id, "professional portfolio")

    return f"""You are an expert portfolio writer. Convert the resume below into polished portfolio website content.
Style: {style_hint}

RULES:
- Use ONLY facts from the resume. Do NOT invent employers, degrees, dates, or projects.
- Write professional sentences: strong tagline, bio, experience bullets with impact verbs.
- Group skills into categories: frontend, backend, database, devops, other (omit empty categories).
- experience[].highlights: 2-4 achievement bullets per role when possible.
- Return ONLY valid JSON (no markdown fences).

JSON schema:
{{
  "personal": {{ "name", "title", "tagline", "email", "phone", "location", "bio" }},
  "about": {{ "headline", "description", "highlights": ["string"] }},
  "skills": {{ "category": ["skill"] }},
  "experience": [{{ "company", "title", "period", "description", "highlights": ["string"] }}],
  "education": [{{ "institution", "degree", "year" }}],
  "projects": [{{ "name", "description", "technologies": ["string"], "url", "github" }}],
  "certifications": [{{ "name", "issuer", "year" }}],
  "links": {{ "github", "linkedin", "twitter", "website" }}
}}

RESUME:
{resume_text[:8000]}
"""


def _parse_llm_json(raw: str) -> Optional[Dict[str, Any]]:
    s = (raw or "").strip()
    if s.startswith("```"):
        lines = s.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        s = "\n".join(lines).strip()
    start = s.find("{")
    end = s.rfind("}")
    if start >= 0 and end > start:
        s = s[start : end + 1]
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        return None


def _normalize_portfolio_data(data: Dict[str, Any], user_email: str) -> Dict[str, Any]:
    personal = data.get("personal") or {}
    about = data.get("about") or {}
    links = data.get("links") or {}
    if not personal.get("email") and user_email:
        personal["email"] = user_email
    if not links.get("email") and personal.get("email"):
        links["email"] = f"mailto:{personal['email']}"
    return {
        "personal": personal,
        "about": about,
        "skills": data.get("skills") or {},
        "experience": (data.get("experience") or [])[:6],
        "education": (data.get("education") or [])[:4],
        "projects": (data.get("projects") or [])[:6],
        "certifications": (data.get("certifications") or [])[:5],
        "links": links,
    }


def _call_llm(provider: str, api_key: str, prompt: str, model: str) -> str:
    if provider == "openai":
        return _call_openai(api_key, prompt, model or "gpt-4o-mini")
    if provider == "openrouter":
        return _call_openrouter(api_key, prompt, model or OPENROUTER_DEFAULT_MODEL)
    if provider == "anthropic":
        return _call_claude(api_key, prompt, model or "claude-3-haiku-20240307")
    if provider == "gemini":
        return _call_gemini(api_key, prompt, model or "gemini-2.0-flash")
    raise ValueError(f"Unsupported provider: {provider}")


def _call_openai(api_key: str, prompt: str, model: str) -> str:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Respond only with valid JSON. No markdown."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 3000,
    }
    return _post_json(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        lambda o: (o.get("choices") or [{}])[0].get("message", {}).get("content", ""),
    )


def _call_openrouter(api_key: str, prompt: str, model: str) -> str:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Respond only with valid JSON. No markdown."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 3000,
    }
    return _post_json(
        "https://openrouter.ai/api/v1/chat/completions",
        payload,
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": OPENROUTER_HTTP_REFERER,
            "X-Title": "CodeXCareer Portfolio Builder",
        },
        lambda o: (o.get("choices") or [{}])[0].get("message", {}).get("content", ""),
    )


def _call_claude(api_key: str, prompt: str, model: str) -> str:
    payload = {
        "model": model,
        "max_tokens": 3000,
        "messages": [{"role": "user", "content": prompt}],
    }
    return _post_json(
        "https://api.anthropic.com/v1/messages",
        payload,
        {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        },
        lambda o: next(
            (b.get("text", "") for b in (o.get("content") or []) if b.get("type") == "text"),
            "",
        ),
    )


def _call_gemini(api_key: str, prompt: str, model: str) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 3000,
            "responseMimeType": "application/json",
        },
    }
    return _post_json(
        url,
        payload,
        {"Content-Type": "application/json"},
        lambda o: next(
            (
                p.get("text", "")
                for c in (o.get("candidates") or [])
                for p in (c.get("content", {}).get("parts") or [])
                if "text" in p
            ),
            "",
        ),
        timeout=60,
    )


def _post_json(url: str, payload: dict, headers: dict, extract, timeout: int = 90) -> str:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    err = out.get("error")
    if err:
        msg = err.get("message", str(err)) if isinstance(err, dict) else str(err)
        raise RuntimeError(msg)
    return (extract(out) or "").strip()
