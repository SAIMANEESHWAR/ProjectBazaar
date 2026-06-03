"""
Deterministic keyword injection for ATS fixes.

Rules: do not remove content, avoid full rewrites, cap injections to reduce stuffing.
Places tools/languages/stack phrases in SKILLS; competency/outcome phrases in projects/experience/summary.
Optional single LLM pass for minimal sentence enhancement (disabled unless caller passes credentials).
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import urllib.request
from typing import Any


# Keep in sync with ProjectBazaar/components/fix-resume/garamondResumeStyles.ts
_GARAMOND_RESUME_STYLES = """
    .garamond-resume-root {
      --black: #111; --gray: #555; --light-gray: #e8e8e8;
      --section-bg: #d0d0d0; --link: #1a4fa0;
      --body-font: 'EB Garamond', Georgia, serif;
      --head-font: 'EB Garamond', Georgia, serif;
      background: #fff;
      font-family: var(--body-font);
      font-size: 14px;
      color: var(--black);
      line-height: 1.55;
    }
    .garamond-resume-root *,
    .garamond-resume-root *::before,
    .garamond-resume-root *::after { box-sizing: border-box; }
    .garamond-resume-root .page {
      background: #fff; max-width: 780px;
      margin: 36px auto; padding: 36px;
    }
    .garamond-resume-root .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
    .garamond-resume-root .header-left h1 { font-family: var(--head-font); font-size: 28px; font-weight: 700; line-height: 1.15; margin: 0; }
    .garamond-resume-root .header-left .subtitle { font-size: 13px; color: var(--gray); margin-top: 2px; }
    .garamond-resume-root .header-right { text-align: right; font-size: 12.5px; line-height: 1.9; }
    .garamond-resume-root .header-right a { color: var(--link); text-decoration: none; display: block; }
    .garamond-resume-root .header-right a:hover { text-decoration: underline; }
    .garamond-resume-root .section-title {
      background: var(--section-bg); font-size: 11px; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
      padding: 3px 6px; margin: 14px 0 8px 0; color: var(--black);
    }
    .garamond-resume-root table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
    .garamond-resume-root thead tr { border-bottom: 1px solid var(--light-gray); }
    .garamond-resume-root th { text-align: left; font-weight: 600; padding: 4px 6px 4px 0; font-size: 12.5px; }
    .garamond-resume-root td { padding: 5px 8px 5px 0; vertical-align: top; word-wrap: break-word; hyphens: auto; }
    .garamond-resume-root table td:nth-child(4),
    .garamond-resume-root table th:nth-child(4) { width: 11em; white-space: normal; font-size: 12.5px; }
    .garamond-resume-root tbody tr:not(:last-child) td { border-bottom: 1px solid #f0f0f0; }
    .garamond-resume-root .skills-list { list-style: disc; padding-left: 18px; font-size: 13px; margin: 0; }
    .garamond-resume-root .skills-list li { margin-bottom: 10px; line-height: 1.45; }
    .garamond-resume-root .skills-list li strong { font-weight: 600; }
    .garamond-resume-root .garamond-entries .entry {
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ececec;
    }
    .garamond-resume-root .garamond-entries .entry:last-child {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 0;
    }
    .garamond-resume-root .entry-title { font-weight: 700; font-size: 13.5px; margin-bottom: 2px; }
    .garamond-resume-root .entry-title .org { font-weight: 400; color: var(--gray); }
    .garamond-resume-root .entry-bullets { list-style: none; padding-left: 10px; margin-top: 2px; margin-bottom: 0; }
    .garamond-resume-root .entry-bullets li { position: relative; padding-left: 14px; margin-bottom: 2px; font-size: 13px; color: #222; }
    .garamond-resume-root .entry-bullets li::before { content: '–'; position: absolute; left: 0; color: var(--gray); }
    .garamond-resume-root .simple-list { list-style: disc; padding-left: 18px; font-size: 13px; margin: 0; }
    .garamond-resume-root .simple-list.profile-plain { list-style: none; padding-left: 0; }
    .garamond-resume-root .simple-list.profile-plain li { margin-bottom: 8px; line-height: 1.5; }
    .garamond-resume-root .simple-list.achievements-list li { margin-bottom: 7px; line-height: 1.48; }
    .garamond-resume-root .simple-list li { margin-bottom: 3px; }
    .garamond-resume-root .cert-meta { font-size: 11.5px; color: var(--gray); }
    .garamond-resume-root .cert-desc { font-size: 12px; color: #444; }
    .garamond-resume-root mark.garamond-injected-kw {
      background: rgba(251, 191, 36, 0.42);
      color: inherit;
      border-radius: 2px;
      padding: 0 2px;
      font-weight: 600;
    }
    @media print {
      .garamond-resume-root { background: #fff; }
      .garamond-resume-root .page { box-shadow: none; margin: 0; max-width: 100%; }
      .garamond-resume-root mark.garamond-injected-kw {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
""".strip()


def _sanitize_llm_html(html: str) -> str:
    """
    Extremely defensive sanitization for LLM HTML.
    We only support a print-only resume document; strip scripting and event handlers.
    """
    s = (html or "").strip()
    # Strip scripts entirely
    s = re.sub(r"(?is)<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", s)
    # Strip inline event handlers (onclick=..., onload=...)
    s = re.sub(r"""(?is)\son[a-z]+\s*=\s*(['"]).*?\1""", "", s)
    s = re.sub(r"""(?is)\son[a-z]+\s*=\s*[^\s>]+""", "", s)
    # Disallow iframes/images/videos
    s = re.sub(r"(?is)<\s*(iframe|img|video|audio|object|embed)[^>]*>", "", s)
    # Limit external href/src to font link only (best-effort)
    s = re.sub(
        r"""(?is)<\s*link([^>]+?)href\s*=\s*(['"])(?!https://fonts\.googleapis\.com/css2\?family=EB\+Garamond).*?\2([^>]*)>""",
        "",
        s,
    )
    return s.strip()


def render_resume_html_with_llm(
    resume_text: str,
    missing_keywords: list[str],
    llm_config: dict[str, Any] | None,
    *,
    user_id: str | None = None,
) -> str:
    """
    Generate a full HTML document for the Garamond resume template using an LLM.
    Fail-hard: raise RuntimeError on any invalid output.
    """
    provider = _norm_provider(str((llm_config or {}).get("provider") or ""))
    api_key = str((llm_config or {}).get("apiKey") or "").strip()
    model = str((llm_config or {}).get("model") or "").strip() or None

    if (not api_key) and user_id:
        from ats_resume_scorer import get_user_llm_config  # type: ignore

        keys, models = get_user_llm_config(user_id)
        keys = keys or {}
        models = models or {}
        api_key = (keys.get(provider) or "").strip()
        if not model:
            model = (models.get(provider) or "").strip() or None

    if not api_key:
        env_key = ""
        if provider == "openrouter":
            env_key = os.environ.get("OPENROUTER_API_KEY", "") or os.environ.get("OPENROUTER_KEY", "")
        elif provider == "openai":
            env_key = os.environ.get("OPENAI_API_KEY", "") or os.environ.get("OPENAI_KEY", "")
        elif provider == "gemini":
            env_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
        elif provider == "anthropic":
            env_key = os.environ.get("ANTHROPIC_API_KEY", "") or os.environ.get("CLAUDE_API_KEY", "")
        if env_key.strip():
            api_key = env_key.strip()

    if not api_key or not provider:
        raise RuntimeError(
            "No LLM API key available to render HTML. "
            "Use a saved key (server must read DynamoDB), paste Fix-only / main API key in the app, or set provider env on the server."
        )

    rt = (resume_text or "").strip()
    if not rt:
        raise RuntimeError("Resume text is empty; cannot render HTML.")
    rt = rt[:9000]

    kw = [k.strip() for k in (missing_keywords or []) if isinstance(k, str) and k.strip()][:20]
    kw_blob = ", ".join(kw)

    # Provide the exact template markup (no JS) so the model keeps structure unchanged.
    # Use the user's provided template (without the JS renderer). The model should fill content
    # directly in the DOM, not rely on any scripts.
    template_html = (
        "<!DOCTYPE html>\n"
        "<html lang=\"en\">\n"
        "<head>\n"
        "  <meta charset=\"UTF-8\" />\n"
        "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"/>\n"
        "  <title>Resume</title>\n"
        "  <link href=\"https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap\" rel=\"stylesheet\"/>\n"
        "  <style>\n"
        "    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n"
        "    :root {\n"
        "      --black: #111; --gray: #555; --light-gray: #e8e8e8;\n"
        "      --section-bg: #d0d0d0; --link: #1a4fa0;\n"
        "      --body-font: 'EB Garamond', Georgia, serif;\n"
        "      --head-font: 'EB Garamond', Georgia, serif;\n"
        "    }\n"
        "    body {\n"
        "      background: #fff;\n"
        "      font-family: var(--body-font);\n"
        "      font-size: 14px; color: var(--black); line-height: 1.55;\n"
        "    }\n"
        "    .page {\n"
        "      background: #fff; max-width: 780px;\n"
        "      margin: 36px auto; padding: 36px;\n"
        "    }\n"
        "\n"
        "    /* HEADER */\n"
        "    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }\n"
        "    .header-left h1 { font-family: var(--head-font); font-size: 28px; font-weight: 700; line-height: 1.15; }\n"
        "    .header-left .subtitle { font-size: 13px; color: var(--gray); margin-top: 2px; }\n"
        "    .header-right { text-align: right; font-size: 12.5px; line-height: 1.9; }\n"
        "    .header-right a { color: var(--link); text-decoration: none; display: block; }\n"
        "    .header-right a:hover { text-decoration: underline; }\n"
        "\n"
        "    /* SECTION TITLE */\n"
        "    .section-title {\n"
        "      background: var(--section-bg); font-size: 11px; font-weight: 700;\n"
        "      letter-spacing: 0.12em; text-transform: uppercase;\n"
        "      padding: 3px 6px; margin: 14px 0 8px 0; color: var(--black);\n"
        "    }\n"
        "\n"
        "    /* TABLE */\n"
        "    table { width: 100%; border-collapse: collapse; font-size: 13px; }\n"
        "    thead tr { border-bottom: 1px solid var(--light-gray); }\n"
        "    th { text-align: left; font-weight: 600; padding: 4px 6px 4px 0; font-size: 12.5px; }\n"
        "    td { padding: 3px 6px 3px 0; vertical-align: top; }\n"
        "    tr:not(:last-child) td { border-bottom: 1px solid #f0f0f0; }\n"
        "\n"
        "    /* SKILLS */\n"
        "    .skills-list { list-style: disc; padding-left: 18px; font-size: 13px; }\n"
        "    .skills-list li { margin-bottom: 3px; }\n"
        "    .skills-list li strong { font-weight: 600; }\n"
        "\n"
        "    /* ENTRIES */\n"
        "    .entry { margin-bottom: 10px; }\n"
        "    .entry-title { font-weight: 700; font-size: 13.5px; margin-bottom: 2px; }\n"
        "    .entry-title .org { font-weight: 400; color: var(--gray); }\n"
        "    .entry-bullets { list-style: none; padding-left: 10px; margin-top: 2px; }\n"
        "    .entry-bullets li { position: relative; padding-left: 14px; margin-bottom: 2px; font-size: 13px; color: #222; }\n"
        "    .entry-bullets li::before { content: '–'; position: absolute; left: 0; color: var(--gray); }\n"
        "\n"
        "    /* PLAIN LIST */\n"
        "    .simple-list { list-style: disc; padding-left: 18px; font-size: 13px; }\n"
        "    .simple-list li { margin-bottom: 3px; }\n"
        "    .cert-meta { font-size: 11.5px; color: var(--gray); }\n"
        "    .cert-desc { font-size: 12px; color: #444; }\n"
        "\n"
        "    @media print {\n"
        "      body { background: #fff; }\n"
        "      .page { box-shadow: none; margin: 0; max-width: 100%; }\n"
        "    }\n"
        "  </style>\n"
        "</head>\n"
        "<body>\n"
        "<div class=\"page\">\n"
        "  <div class=\"header\">\n"
        "    <div class=\"header-left\">\n"
        "      <h1 id=\"r-name\"></h1>\n"
        "      <div class=\"subtitle\" id=\"r-subtitle\"></div>\n"
        "    </div>\n"
        "    <div class=\"header-right\" id=\"r-contacts\"></div>\n"
        "  </div>\n"
        "  <div id=\"r-sections\"></div>\n"
        "</div>\n"
        "</body>\n"
        "</html>\n"
    )

    prompt = (
        "Return ONLY a single full HTML document (no markdown). Requirements:\n"
        "- Must start with <!DOCTYPE html>\n"
        "- Must include EB Garamond font link:\n"
        "  <link href=\"https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&display=swap\" rel=\"stylesheet\"/>\n"
        "- Must include a <style> tag containing EXACTLY the CSS below (copy/paste as-is):\n"
        f"<style>{_GARAMOND_RESUME_STYLES}</style>\n"
        "- Body must contain <div class=\"garamond-resume-root\"><div class=\"page\">...</div></div>\n"
        "- Keep the exact template structure for header containers:\n"
        "  .header, .header-left, .subtitle, .header-right, #r-name, #r-subtitle, #r-contacts, #r-sections.\n"
        "- Do NOT include <script>, images, iframes, or any external resources other than the font link.\n"
        "- If you include keyword highlighting, wrap ONLY injected keywords with:\n"
        "  <mark class=\"garamond-injected-kw\">keyword</mark>\n\n"
        "Use the following HTML TEMPLATE exactly as the base (keep the same tags/ids/classes; do NOT include any <script>):\n"
        f"{template_html}\n\n"
        "Populate the template like this:\n"
        "- Put the full name text inside the existing <h1 id=\"r-name\"> element.\n"
        "- Put subtitle lines (with <br/>) inside <div id=\"r-subtitle\">.\n"
        "- Fill <div id=\"r-contacts\"> with one <a> per contact (email/phone/linkedin/github/portfolio), same as the template style.\n"
        "- Fill <div id=\"r-sections\"> with the resume sections.\n"
        "  Use ONLY the CSS classes that exist in the template CSS:\n"
        "  - section bars: <div class=\"section-title\">TITLE</div>\n"
        "  - education tables: <table>...</table>\n"
        "  - skills lists: <ul class=\"skills-list\">...</ul>\n"
        "  - experience/projects entries: <div class=\"entry\"><div class=\"entry-title\">...</div><ul class=\"entry-bullets\">...</ul></div>\n"
        "  - simple lists: <ul class=\"simple-list\">...</ul> (use .cert-meta / .cert-desc spans when needed)\n\n"
        f"KEYWORDS_TO_INJECT: {kw_blob}\n\n"
        f"RESUME_TEXT:\n{rt}\n"
    )

    from ats_resume_scorer import (  # type: ignore
        _call_openai,
        _call_openrouter,
        _call_claude,
        _call_gemini,
    )

    if provider == "openai":
        raw = _call_openai(api_key, prompt, model)
    elif provider == "openrouter":
        raw = _call_openrouter(api_key, prompt, model)
    elif provider == "anthropic":
        raw = _call_claude(api_key, prompt, model)
    elif provider == "gemini":
        raw = _call_gemini(api_key, prompt, model)
    else:
        raise RuntimeError(f"Unsupported provider for HTML rendering: {provider}")

    html = _sanitize_llm_html(raw)
    if len(html.encode("utf-8")) > 450_000:
        raise RuntimeError("Rendered HTML too large.")
    if "<!DOCTYPE html" not in html[:120].upper() and "<!doctype html" not in html[:120].lower():
        raise RuntimeError("Rendered HTML missing doctype.")
    if "garamond-resume-root" not in html or "class=\"page\"" not in html:
        raise RuntimeError("Rendered HTML missing required template root/page structure.")
    if re.search(r"(?is)<\s*script\b", html):
        raise RuntimeError("Rendered HTML contains scripts (blocked).")
    return html


def _tel_dedup_key(digits: str) -> str:
    """
    Same physical line (e.g. +91-7981833625 vs 7981833625) must share one key so the UI
    does not list the phone twice.
    """
    d = re.sub(r"\D", "", digits or "")
    if not d:
        return "tel:"
    # India: 91 + 10-digit mobile (leading 6–9)
    if len(d) >= 12 and d.startswith("91") and len(d) <= 13 and d[2] in "6789":
        return "tel:in:" + d[-10:]
    if len(d) == 10 and d[0] in "6789":
        return "tel:in:" + d
    # US / NANP: leading 1 + 10 digits
    if len(d) == 11 and d.startswith("1"):
        return "tel:1:" + d[1:]
    return "tel:" + d


def _contact_dedup_key(href: str) -> str:
    """Stable key so regex-extracted and LLM contacts dedupe."""
    h = (href or "").strip().lower()
    if h.startswith("mailto:"):
        return "mail:" + re.sub(r"\s+", "", h.split(":", 1)[1])
    if h.startswith("tel:"):
        d = re.sub(r"\D", "", h[4:])
        return _tel_dedup_key(d) if d else h
    m = re.search(r"linkedin\.com/in/([\w-]+)", h, re.I)
    if m:
        return "li:" + m.group(1).lower()
    m = re.search(r"github\.com/([\w-]+)", h, re.I)
    if m:
        return "gh:" + m.group(1).lower()
    return h


def _contacts_extracted_from_resume_text(text: str) -> list[dict[str, str]]:
    """Deterministic header contacts from plain resume text (fills LLM gaps)."""
    t = (text or "").strip()
    if not t:
        return []
    out: list[dict[str, str]] = []
    seen: set[str] = set()

    def push(key: str, icon: str, label: str, href: str) -> None:
        if key in seen:
            return
        seen.add(key)
        out.append({"icon": icon, "label": label, "href": href})

    # Emails (skip image-looking tokens)
    for m in re.finditer(
        r"\b([a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+)\b",
        t,
    ):
        em = m.group(1).strip().lower()
        if len(em) > 120 or em.endswith((".png", ".jpg", ".jpeg", ".gif", ".svg")):
            continue
        href = f"mailto:{em}"
        push(_contact_dedup_key(href), "✉", em, href)

    # Phone numbers (US +1, India +91 / 10-digit, generic international-ish)
    phone_patterns = (
        r"\+\s*91[\s.-]*[6-9]\d{9}\b",
        r"(?<![\w.])(?:\+1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b",
        r"(?<!\d)[6-9]\d{9}(?!\d)",  # Indian mobile without +91
    )
    for pat in phone_patterns:
        for m in re.finditer(pat, t):
            raw = re.sub(r"\s+", " ", m.group(0).strip())
            digits = re.sub(r"\D", "", raw)
            if len(digits) < 10 or len(digits) > 15:
                continue
            # Prefer E.164-style href when we recognize India (+91) so tel: matches dedup with bare 10-digit.
            if len(digits) == 12 and digits.startswith("91") and digits[2] in "6789":
                href = f"tel:+{digits}"
            elif len(digits) == 10 and digits[0] in "6789":
                href = f"tel:+91{digits}"
            else:
                href = f"tel:{digits}"
            push(_contact_dedup_key(href), "📞", raw, href)

    # LinkedIn (with or without https://)
    for m in re.finditer(r"https?://(?:www\.)?linkedin\.com/in/[\w-]+/?", t, re.I):
        url = m.group(0).strip().rstrip(").,;]")
        if not url.lower().startswith("http"):
            url = "https://" + url
        url = url.split("?")[0].rstrip("/")
        lab = url.replace("https://", "").replace("http://", "")
        push(_contact_dedup_key(url), "in", lab, url)
    for m in re.finditer(r"(?<![\w/])(?:www\.)?linkedin\.com/in/([\w-]+)\b", t, re.I):
        user = m.group(1).strip()
        url = f"https://www.linkedin.com/in/{user}"
        lab = f"linkedin.com/in/{user}"
        push(_contact_dedup_key(url), "in", lab, url)

    # GitHub profile URLs
    for m in re.finditer(r"https?://(?:www\.)?github\.com/[\w-]+/?", t, re.I):
        url = m.group(0).strip().rstrip(").,;]")
        url = url.split("?")[0].rstrip("/")
        if not url.lower().startswith("http"):
            url = "https://" + url.lstrip("/")
        lab = url.replace("https://", "").replace("http://", "")
        push(_contact_dedup_key(url), "⌥", lab, url)

    # Bare github.com/user (no scheme)
    for m in re.finditer(r"(?<![\w/])github\.com/([\w-]{1,39})\b", t, re.I):
        user = m.group(1).strip()
        if user.lower() in ("features", "topics", "explore", "settings", "login", "signup"):
            continue
        url = f"https://github.com/{user}"
        push(_contact_dedup_key(url), "⌥", f"github.com/{user}", url)

    return out


def _merge_contacts_from_resume_text(
    resume_text: str,
    llm_contacts: list[dict[str, Any]],
    *,
    max_contacts: int = 12,
) -> list[dict[str, Any]]:
    """
    Prefer channels found in raw resume text, then append LLM-only rows without duplicates.
    Order: extracted (email → phone → linkedin → github) then remaining LLM contacts.
    """
    extracted = _contacts_extracted_from_resume_text(resume_text)
    seen: set[str] = set()
    merged: list[dict[str, Any]] = []

    for c in extracted:
        href = str(c.get("href") or "").strip()
        if not href:
            continue
        k = _contact_dedup_key(href)
        if k in seen:
            continue
        seen.add(k)
        merged.append(
            {
                "icon": str(c.get("icon") or "").strip(),
                "label": str(c.get("label") or "").strip(),
                "href": href,
            }
        )
        if len(merged) >= max_contacts:
            return merged

    for c in llm_contacts:
        if not isinstance(c, dict):
            continue
        href = str(c.get("href") or "").strip()
        label = str(c.get("label") or "").strip()
        if not href or not label:
            continue
        k = _contact_dedup_key(href)
        if k in seen:
            continue
        low = label.strip().lower()
        if low in ("email", "phone", "location", "github", "linkedin"):
            continue
        seen.add(k)
        merged.append(
            {
                "icon": str(c.get("icon") or "").strip(),
                "label": label,
                "href": href,
            }
        )
        if len(merged) >= max_contacts:
            break

    return merged


def render_resume_data_with_llm(
    resume_text: str,
    missing_keywords: list[str],
    llm_config: dict[str, Any] | None,
    *,
    user_id: str | None = None,
) -> tuple[dict[str, Any], list[str]]:
    """
    Generate the `resume_preview.html` data object (the `const resume = {...}` JSON) via LLM,
    then deterministically inject missing ATS keywords not already present in the text.

    Returns (resume_data, added_keywords_in_order).
    Fail-hard: raises on invalid JSON/output.
    """
    provider = _norm_provider(str((llm_config or {}).get("provider") or ""))
    api_key = str((llm_config or {}).get("apiKey") or "").strip()
    model = str((llm_config or {}).get("model") or "").strip() or None

    if (not api_key) and user_id:
        from ats_resume_scorer import get_user_llm_config  # type: ignore

        keys, models = get_user_llm_config(user_id)
        keys = keys or {}
        models = models or {}
        api_key = (keys.get(provider) or "").strip()
        if not model:
            model = (models.get(provider) or "").strip() or None

    # Local-dev fallback: allow provider key via environment variable when DynamoDB is unavailable.
    if not api_key:
        env_key = ""
        if provider == "openrouter":
            env_key = os.environ.get("OPENROUTER_API_KEY", "") or os.environ.get("OPENROUTER_KEY", "")
        elif provider == "openai":
            env_key = os.environ.get("OPENAI_API_KEY", "") or os.environ.get("OPENAI_KEY", "")
        elif provider == "gemini":
            env_key = os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GOOGLE_API_KEY", "")
        elif provider == "anthropic":
            env_key = os.environ.get("ANTHROPIC_API_KEY", "") or os.environ.get("CLAUDE_API_KEY", "")
        if env_key.strip():
            api_key = env_key.strip()

    if not api_key or not provider:
        raise RuntimeError(
            "No LLM API key available to render resume JSON. "
            "Saved keys are read from DynamoDB on this server (needs AWS credentials when running locally). "
            "Paste your key in “Fix Resume API key (temporary)” in the app, leave the same key in the main API key field, "
            "or set OPENROUTER_API_KEY / OPENAI_API_KEY / etc. on the Fix server process."
        )

    rt = (resume_text or "").strip()
    if not rt:
        raise RuntimeError("Resume text is empty; cannot render resume JSON.")
    rt = rt[:9000]

    kw = [k.strip() for k in (missing_keywords or []) if isinstance(k, str) and k.strip()][:25]

    schema = {
        "name": "string",
        "subtitle": ["string"],
        "contacts": [{"icon": "string", "label": "string", "href": "string"}],
        "sections": [
            {
                "type": "\"table\"|\"skills\"|\"entries\"|\"list\"",
                "title": "string",
            }
        ],
    }

    prompt = (
        "Return ONLY valid JSON (no markdown, no code fences, no extra text). "
        "The JSON must match the `resume` object schema used by our template.\n\n"
        "SCHEMA (types only):\n"
        f"{json.dumps(schema, ensure_ascii=False)}\n\n"
        "Rules:\n"
        "- Use RESUME_TEXT as the only source of truth.\n"
        "- Do NOT invent companies, projects, degrees, dates, links.\n"
        "- `sections[].type` must be exactly one of: table, skills, entries, list.\n"
        "- table section: {type:'table', title, headers:string[], rows:string[][]}\n"
        "- skills section: {type:'skills', title, items:[{label:string,value:string}]}\n"
        "- entries section: {type:'entries', title, items:[{title:string, org?:string, bullets:string[]}]}\n"
        "- list section: {type:'list', title, items:(string | {text:string, meta?:string, desc?:string})[]}\n"
        "- Keep bullets concise (1 line each). Cap: 8 bullets per entry.\n"
        "- Prefer separate entries per role/project (do not merge).\n"
        "- Contacts: `contacts[].label` must be the actual value (email address / phone number / linkedin URL / github URL), not placeholders like \"Email\".\n"
        "- Contacts: `contacts[].icon` should be one of: \"✉\", \"📞\", \"in\", \"⌥\" (or empty).\n"
        "- Contacts: include **every** channel that appears in RESUME_TEXT (email, phone, LinkedIn, GitHub). "
        "Do not drop any of these if they are present; one `contacts[]` row per channel.\n"
        "- Include KEYWORDS_TO_INJECT by naturally placing them in appropriate bullets/skills where truthful.\n\n"
        f"KEYWORDS_TO_INJECT: {', '.join(kw)}\n\n"
        f"RESUME_TEXT:\n{rt}\n"
    )

    from ats_resume_scorer import (  # type: ignore
        _call_openai,
        _call_openrouter,
        _call_claude,
        _call_gemini,
    )

    if provider == "openai":
        raw = _call_openai(api_key, prompt, model)
    elif provider == "openrouter":
        raw = _call_openrouter(api_key, prompt, model)
    elif provider == "anthropic":
        raw = _call_claude(api_key, prompt, model)
    elif provider == "gemini":
        raw = _call_gemini(api_key, prompt, model)
    else:
        raise RuntimeError(f"Unsupported provider for resume JSON: {provider}")

    obj = _parse_possible_json(raw)
    if not obj:
        raise RuntimeError("LLM returned invalid JSON for resume data.")

    # Minimal validation + normalization
    out: dict[str, Any] = {}
    out["name"] = str(obj.get("name") or "").strip()
    subtitle = obj.get("subtitle")
    out["subtitle"] = [str(x).strip() for x in subtitle] if isinstance(subtitle, list) else []
    contacts = obj.get("contacts")
    if isinstance(contacts, list):
        c_out = []
        for c in contacts:
            if not isinstance(c, dict):
                continue
            icon = str(c.get("icon") or "").strip()
            label = str(c.get("label") or "").strip()
            href = str(c.get("href") or "").strip()

            # Normalize common placeholder outputs from models.
            low_label = label.lower()
            low_icon = icon.lower()
            if href.startswith("mailto:"):
                email = href.split(":", 1)[1].strip()
                if low_label in ("email", "e-mail", "mail") or (not label and email):
                    label = email
                if low_icon in ("email", "mail", ""):
                    icon = "✉"
            elif href.startswith("tel:"):
                phone = href.split(":", 1)[1].strip()
                if low_label in ("phone", "mobile", "contact") or (not label and phone):
                    label = phone
                if low_icon in ("phone", "mobile", ""):
                    icon = "📞"
            elif "linkedin.com" in href:
                if low_label in ("linkedin", "link", "profile") or not label:
                    label = href.replace("https://", "").replace("http://", "")
                if low_icon in ("linkedin", "in", ""):
                    icon = "in"
            elif "github.com" in href:
                if low_label in ("github", "git", "") or not label:
                    label = href.replace("https://", "").replace("http://", "")
                if low_icon in ("github", "git", ""):
                    icon = "⌥"

            # Drop still-placeholder contacts.
            if label.strip().lower() in ("email", "phone", "location", "github", "linkedin"):
                continue
            if label and href:
                c_out.append({"icon": icon, "label": label, "href": href})
            if len(c_out) >= 12:
                break
        out["contacts"] = _merge_contacts_from_resume_text(rt, c_out)
    else:
        out["contacts"] = _merge_contacts_from_resume_text(rt, [])

    sections = obj.get("sections")
    if not isinstance(sections, list):
        raise RuntimeError("resume.sections must be an array.")
    out_secs = []
    for sec in sections[:30]:
        if not isinstance(sec, dict):
            continue
        t = str(sec.get("type") or "").strip()
        title = str(sec.get("title") or "").strip()
        if t not in ("table", "skills", "entries", "list") or not title:
            continue
        s2: dict[str, Any] = {"type": t, "title": title}
        if t == "table":
            headers = sec.get("headers")
            rows = sec.get("rows")
            s2["headers"] = [str(h).strip() for h in headers] if isinstance(headers, list) else []
            if isinstance(rows, list):
                clean_rows = []
                for r in rows[:30]:
                    if isinstance(r, list):
                        clean_rows.append([str(c).strip() for c in r][:10])
                s2["rows"] = clean_rows
            else:
                s2["rows"] = []
        elif t == "skills":
            items = sec.get("items")
            it_out = []
            if isinstance(items, list):
                for it in items[:40]:
                    if isinstance(it, dict):
                        label = str(it.get("label") or "").strip()
                        value = str(it.get("value") or "").strip()
                        if value:
                            it_out.append({"label": label, "value": value})
            s2["items"] = it_out
        elif t == "entries":
            items = sec.get("items")
            ent_out = []
            if isinstance(items, list):
                for it in items[:40]:
                    if not isinstance(it, dict):
                        continue
                    et = str(it.get("title") or "").strip()
                    org = str(it.get("org") or "").strip()
                    bullets = it.get("bullets")
                    b_out = []
                    if isinstance(bullets, list):
                        for b in bullets[:8]:
                            bs = str(b).strip()
                            if bs:
                                b_out.append(bs)
                    if et and b_out:
                        e = {"title": et, "bullets": b_out}
                        if org:
                            e["org"] = org
                        ent_out.append(e)
            s2["items"] = ent_out
        else:  # list
            items = sec.get("items")
            list_out: list[Any] = []
            if isinstance(items, list):
                for it in items[:60]:
                    if isinstance(it, str):
                        s = it.strip()
                        if s:
                            list_out.append(s)
                    elif isinstance(it, dict):
                        text = str(it.get("text") or "").strip()
                        if not text:
                            continue
                        x: dict[str, Any] = {"text": text}
                        meta = it.get("meta")
                        desc = it.get("desc")
                        if isinstance(meta, str) and meta.strip():
                            x["meta"] = meta.strip()
                        if isinstance(desc, str) and desc.strip():
                            x["desc"] = desc.strip()
                        list_out.append(x)
            s2["items"] = list_out
        out_secs.append(s2)
    out["sections"] = out_secs

    if not out["name"] and not out_secs:
        raise RuntimeError("Resume JSON was empty after validation.")
    out, added_kw = apply_missing_keywords_to_resume_preview_data(out, kw)
    return out, added_kw

# Max missing phrases to try to place (cost + readability).
_DEFAULT_MAX_KEYWORDS = 12

# Multi-word phrases that read like outcomes / processes / analysis (belong in bullets, not a skills comma-list).
_NARRATIVE_COMPETENCY_RE = re.compile(
    r"(?ix)^.*\b("
    r"findings?|insights?|challenges?|stakeholders?|outcomes?|"
    r"operational\s+process(?:es)?|business\s+challenges?|"
    r"statistical\s+techniques?|analytical\s+findings?|quantitative\s+analysis|"
    r"data-?driven\s+solutions?|data-?driven\s+decisions?|"
    r"key\s+insights?|actionable\s+insights?|research\s+findings?|"
    r"cross-?functional\s+collaboration|stakeholder\s+engagement|"
    r"problem-?solving|critical\s+thinking|time\s+management|"
    r"continuous\s+improvement|best\s+practices|thought\s+leadership"
    r")\b.*$|"
    r"\b(statistical|analytical|quantitative|research)\s+techniques?\b|"
    r"\b(business|operational|strategic|organizational)\s+"
    r"(challenges?|processes|outcomes?|objectives?|goals?|planning|strategy)\b|"
    r"\b(data-?driven|evidence-?based)\s+"
    r"(solutions?|insights?|outcomes?|approaches?|decisions?|recommendations?)\b"
)

# Multi-word phrases that are clearly tools / methods / stacks (OK in SKILLS as one line).
_TECH_SKILL_PHRASE_RE = re.compile(
    r"(?ix)\b("
    r"machine\s+learning|deep\s+learning|natural\s+language(?:\s+processing)?|"
    r"computer\s+vision|reinforcement\s+learning|large\s+language\s+models?|"
    r"power\s+bi|tableau|looker|google\s+analytics|ms\s+excel|microsoft\s+excel|"
    r"rest\s+api|graphql|grpc|soap\s+api|microservices?|ci/?cd|devops|sre\b|"
    r"agile(?:\s+methodology)?|scrum|kanban|test-?driven|object-?oriented|"
    r"amazon\s+web\s+services|google\s+cloud|microsoft\s+azure|"
    r"sql\s+server|postgre(?:sql|s)?|my\s?sql|mongo(?:db)?|dynamodb|redis|kafka|"
    r"apache\s+spark|hadoop|snowflake|etl|elt|dbt\b|airflow|"
    r"react\.?js|node\.?js|vue\.?js|angular|next\.?js|express\.?js|django|flask|fastapi|"
    r"tensorflow|pytorch|keras|scikit-?learn|pandas|numpy|matplotlib|"
    r"docker|kubernetes|terraform|ansible|jenkins|github\s+actions|git\b"
    r")\b"
)

# Multi-word phrase contains a recognizable tool/stack token (word boundaries; avoids "go" in "google").
_TECH_TOKEN_IN_PHRASE_RE = re.compile(
    r"(?i)\b("
    r"sql|aws|gcp|azure|gcloud|kubernetes|docker|terraform|ansible|jenkins|"
    r"github|gitlab|bitbucket|jira|confluence|slack|figma|notion|"
    r"react|angular|vue|svelte|nextjs|nuxt|django|flask|fastapi|rails|spring|dotnet|aspnet|"
    r"node|javascript|typescript|java|python|scala|ruby|php|swift|kotlin|rust|golang|perl|"
    r"html|css|sass|scss|less|jquery|webpack|vite|nginx|apache|linux|unix|bash|zsh|powershell|"
    r"mongodb|postgres|postgresql|mysql|mariadb|sqlite|redis|kafka|cassandra|dynamodb|oracle|"
    r"spark|hadoop|airflow|dbt|snowflake|bigquery|redshift|synapse|"
    r"tensorflow|pytorch|keras|pandas|numpy|scipy|matplotlib|seaborn|opencv|analytics|"
    r"tableau|looker|powerbi|excel|word|powerpoint|outlook|"
    r"graphql|grpc|oauth|jwt|ldap|vpn|cdn|dns|tcp|udp|http|https|ssl|tls|"
    r"etl|elt|sdlc|devops|iac\b|\bci/?cd\b"
    r")\b|(?:c\+\+|c\#|\.net|asp\.net)"
)

# Single-word soft / professional skills → narrative bullets, not the SKILLS comma-list.
_SOFT_SKILL_SINGLE_WORDS = frozenset({
    "stakeholders",
    "stakeholder",
    "leadership",
    "communication",
    "communications",
    "collaboration",
    "teamwork",
    "accountability",
    "empathy",
    "negotiation",
    "negotiations",
    "presentation",
    "presentations",
    "interpersonal",
    "mentoring",
    "coaching",
    "facilitation",
    "adaptability",
    "resilience",
    "creativity",
    "integrity",
    "professionalism",
    "networking",
    "influence",
    "delegation",
    "organization",
    "organisation",
    "prioritization",
    "prioritisation",
    "multitasking",
    "listening",
    "dedication",
    "enthusiasm",
    "patience",
    "confidence",
    "reliability",
    "dependability",
    "flexibility",
    "judgment",
    "judgement",
    "motivation",
    "ownership",
})

# Single-word terms that read as engineering / stack (keep in SKILLS even if ambiguous).
_EXPLICIT_SKILL_SINGLE_WORDS = frozenset({
    "agile",
    "scrum",
    "kanban",
    "oop",
    "etl",
    "elt",
    "sql",
    "nosql",
    "aws",
    "gcp",
    "azure",
    "saas",
    "paas",
    "iaas",
    "ci",
    "cd",
    "sdlc",
    "devops",
    "git",
    "linux",
    "unix",
    "bash",
    "excel",
    "tableau",
    "pandas",
    "numpy",
    "keras",
    "tensorflow",
    "pytorch",
    "docker",
    "kubernetes",
    "jenkins",
    "jira",
    "html",
    "css",
    "javascript",
    "typescript",
    "react",
    "angular",
    "vue",
    "node",
    "java",
    "python",
    "scala",
    "kotlin",
    "swift",
    "rust",
    "golang",
    "ruby",
    "php",
    "perl",
    "r",
    "c",
    "matlab",
    "spark",
    "kafka",
    "redis",
    "mongodb",
    "postgres",
    "mysql",
    "graphql",
    "rest",
    "api",
    "oauth",
    "jwt",
})


def _stable_pick_index(keyword: str, n: int) -> int:
    if n <= 0:
        return 0
    h = hashlib.sha256(keyword.encode("utf-8")).digest()
    return int.from_bytes(h[:4], "big") % n


def _looks_like_narrative_competency_phrase(low: str) -> bool:
    """True → weave into experience/project/summary, not raw SKILLS list."""
    if not low.strip():
        return False
    if _NARRATIVE_COMPETENCY_RE.search(low):
        return True
    return False


def _narrative_targets_extra_first(kw: str) -> bool:
    """Extracurricular / certs blocks read better for soft skills and competency phrases."""
    low = " ".join(kw.strip().lower().split())
    if low in _SOFT_SKILL_SINGLE_WORDS:
        return True
    return _looks_like_narrative_competency_phrase(low)


def _looks_like_technical_skill_phrase(low: str) -> bool:
    """True → safe to append as a single skills entry (tool/method/stack)."""
    if _TECH_SKILL_PHRASE_RE.search(low):
        return True
    if _TECH_TOKEN_IN_PHRASE_RE.search(low):
        return True
    return False


def _should_append_keyword_to_skills_list(keyword: str) -> bool:
    """
    Single tokens and clear tech phrases → SKILLS comma-list.
    Competency / outcome phrases (often multi-word) → narrative sections first.
    """
    k = " ".join((keyword or "").strip().split())
    if not k:
        return False
    low = k.lower()

    if " " in k:
        if _looks_like_narrative_competency_phrase(low):
            return False
        if _looks_like_technical_skill_phrase(low):
            return True
        return False

    # Single token
    if low in _SOFT_SKILL_SINGLE_WORDS:
        return False
    if low in _EXPLICIT_SKILL_SINGLE_WORDS:
        return True
    if _TECH_TOKEN_IN_PHRASE_RE.search(low):
        return True
    if _looks_like_technical_skill_phrase(low):
        return True
    # Ambiguous one-word ATS gaps: prefer narrative (experience/projects) over stuffing SKILLS
    return False


def _resume_blob(data: dict[str, Any]) -> str:
    parts: list[str] = []
    parts.append(str(data.get("name") or ""))
    parts.append(str(data.get("summary") or ""))
    parts.append(str(data.get("education") or ""))
    parts.append(str(data.get("extra") or ""))
    for s in data.get("skills") or []:
        parts.append(str(s))
    for e in data.get("experience") or []:
        if isinstance(e, dict):
            parts.append(str(e.get("title") or ""))
            parts.append(str(e.get("detail") or ""))
    for p in data.get("projects") or []:
        if isinstance(p, dict):
            parts.append(str(p.get("name") or ""))
            parts.append(str(p.get("description") or ""))
    return " \n ".join(parts).lower()


def _already_present(blob_lower: str, phrase: str) -> bool:
    pl = phrase.strip().lower()
    if not pl:
        return True
    if pl in blob_lower:
        return True
    toks = [t for t in re.split(r"[^\w+]+", pl) if len(t) > 2]
    if not toks:
        return False
    return all(t.lower() in blob_lower for t in toks)


_NARRATIVE_CONNECTORS = (
    ", with attention to ",
    ", applying ",
    " in the context of ",
    ", addressing ",
    ", incorporating ",
)


def _pick_connector(keyword: str, *, for_narrative_insert: bool) -> str:
    kw = keyword.strip().lower()
    if for_narrative_insert:
        return _NARRATIVE_CONNECTORS[_stable_pick_index(keyword, len(_NARRATIVE_CONNECTORS))]
    if " " in kw or len(kw) > 12:
        return " including "
    if kw in ("sql", "api", "aws", "gcp", "azure", "kubernetes", "docker", "git"):
        return " using "
    return " with "


def _should_continue_with_comma(core: str, *, for_narrative_insert: bool) -> bool:
    """Avoid 'including A including B'; stack related phrases with commas instead."""
    if not for_narrative_insert or not core:
        return False
    low = core.lower()
    if " including " in low:
        return True
    return bool(
        re.search(
            r",\s*(with attention to|applying|in the context of|addressing|incorporating)\b",
            core,
            re.I,
        )
    )


def _inject_into_sentence(
    text: str,
    keyword: str,
    *,
    for_narrative_insert: bool = False,
) -> tuple[str, bool]:
    """
    Append keyword once at end of the sentence/clause without rewriting the rest.
    Returns (new_text, changed).
    """
    t = (text or "").strip()
    if not t:
        return keyword, True
    if keyword.lower() in t.lower():
        return t, False

    end = ""
    core = t
    if core and core[-1] in ".!?":
        end = core[-1]
        core = core[:-1].rstrip()

    if _should_continue_with_comma(core, for_narrative_insert=for_narrative_insert):
        merged = f"{core}, {keyword.strip()}{end}"
        return merged, True

    conn = _pick_connector(keyword, for_narrative_insert=for_narrative_insert)
    tail = conn.strip().lower()
    if core.lower().endswith(tail):
        return t, False

    merged = f"{core}{conn}{keyword.strip()}{end}"
    return merged, True


def _inject_into_paragraph(
    paragraph: str,
    keyword: str,
    *,
    for_narrative_insert: bool = False,
    sentence_index: int = 0,
) -> tuple[str, bool]:
    """Pick a sentence (rotated) to limit stacking many phrases in one sentence."""
    p = (paragraph or "").strip()
    if not p:
        return _inject_into_sentence("", keyword, for_narrative_insert=for_narrative_insert)

    chunks = re.split(r"(?<=[.!?])\s+", p)
    if len(chunks) <= 1:
        return _inject_into_sentence(p, keyword, for_narrative_insert=for_narrative_insert)

    n = len(chunks)
    base = n - 1 - (sentence_index % n)
    for step in range(n):
        idx = (base - step) % n
        new_c, changed = _inject_into_sentence(
            chunks[idx], keyword, for_narrative_insert=for_narrative_insert
        )
        if changed:
            chunks[idx] = new_c
            return " ".join(chunks), True

    return p, False


def apply_missing_keywords(
    structured: dict[str, Any],
    missing_keywords: list[str],
    *,
    max_keywords: int = _DEFAULT_MAX_KEYWORDS,
) -> tuple[dict[str, Any], list[str]]:
    """
    Returns (improved_copy, added_keywords_in_order).

    Mutates a deep copy of structured only.
    """
    import copy

    data = copy.deepcopy(structured)
    blob = _resume_blob(data)
    added: list[str] = []

    # Normalize and filter candidate keywords
    candidates: list[str] = []
    seen = set()
    for raw in missing_keywords or []:
        if not isinstance(raw, str):
            continue
        k = raw.strip()
        if len(k) < 2 or len(k) > 80:
            continue
        low = k.lower()
        if low in seen:
            continue
        seen.add(low)
        if _already_present(blob, k):
            continue
        candidates.append(k)
        if len(candidates) >= max_keywords:
            break

    if not candidates:
        return data, []

    skills: list[str] = list(data.get("skills") or [])
    skill_lower = {s.lower() for s in skills}

    experience: list[dict[str, Any]] = list(data.get("experience") or [])
    projects: list[dict[str, Any]] = list(data.get("projects") or [])

    # 1) Skills: single tokens + clearly technical multi-word phrases (tools/stacks).
    #    Competency / outcome phrases go to narrative sections, not the comma-list.
    remaining: list[str] = []
    for kw in candidates:
        low = kw.lower()
        if low in skill_lower:
            continue
        if _should_append_keyword_to_skills_list(kw):
            skills.append(kw)
            skill_lower.add(low)
            added.append(kw)
            continue
        remaining.append(kw)

    data["skills"] = skills

    # 2) Narrative placement: competency / soft skills prefer extra (activities, certs) first;
    #    other gaps prefer projects → experience → extra → summary.
    exp_idx = 0
    proj_idx = 0
    narrative_i = 0

    for kw in remaining:
        blob = _resume_blob(data)
        if _already_present(blob, kw):
            continue

        section_order: tuple[str, ...] = (
            ("extra", "projects", "experience", "summary")
            if _narrative_targets_extra_first(kw)
            else ("projects", "experience", "extra", "summary")
        )

        placed = False
        for section in section_order:
            if section == "extra":
                extra_text = str(data.get("extra") or "")
                new_e, changed = _inject_into_paragraph(
                    extra_text,
                    kw,
                    for_narrative_insert=True,
                    sentence_index=narrative_i,
                )
                if changed:
                    data["extra"] = new_e
                    added.append(kw)
                    narrative_i += 1
                    placed = True
                    break
            elif section == "projects":
                hit = False
                for _ in range(max(1, len(projects) * 2)):
                    if not projects:
                        break
                    j = proj_idx % len(projects)
                    proj_idx += 1
                    block = projects[j]
                    desc = str(block.get("description") or "")
                    new_d, changed = _inject_into_paragraph(
                        desc,
                        kw,
                        for_narrative_insert=True,
                        sentence_index=narrative_i,
                    )
                    if changed:
                        block["description"] = new_d
                        added.append(kw)
                        narrative_i += 1
                        hit = True
                        break
                if hit:
                    placed = True
                    break
            elif section == "experience":
                hit = False
                for _ in range(max(1, len(experience) * 2)):
                    if not experience:
                        break
                    i = exp_idx % len(experience)
                    exp_idx += 1
                    block = experience[i]
                    detail = str(block.get("detail") or "")
                    new_d, changed = _inject_into_paragraph(
                        detail,
                        kw,
                        for_narrative_insert=True,
                        sentence_index=narrative_i,
                    )
                    if changed:
                        block["detail"] = new_d
                        added.append(kw)
                        narrative_i += 1
                        hit = True
                        break
                if hit:
                    placed = True
                    break
            elif section == "summary":
                summary = str(data.get("summary") or "")
                new_s, changed = _inject_into_paragraph(
                    summary,
                    kw,
                    for_narrative_insert=True,
                    sentence_index=narrative_i,
                )
                if changed:
                    data["summary"] = new_s
                    added.append(kw)
                    narrative_i += 1
                    placed = True
                    break

        if placed:
            continue

        # Fallback: skills line
        low = kw.lower()
        if low not in skill_lower:
            skills.append(kw)
            skill_lower.add(low)
            data["skills"] = skills
            added.append(kw)

    return data, added


def _resume_preview_data_blob(data: dict[str, Any]) -> str:
    """Lowercased text blob for keyword presence checks (resume template JSON shape)."""
    parts: list[str] = []
    parts.append(str(data.get("name") or ""))
    for s in data.get("subtitle") or []:
        parts.append(str(s))
    for c in data.get("contacts") or []:
        if isinstance(c, dict):
            parts.append(str(c.get("label") or ""))
    for sec in data.get("sections") or []:
        if not isinstance(sec, dict):
            continue
        parts.append(str(sec.get("title") or ""))
        t = sec.get("type")
        if t == "table":
            for row in sec.get("rows") or []:
                if isinstance(row, list):
                    parts.extend(str(x) for x in row)
        elif t == "skills":
            for it in sec.get("items") or []:
                if isinstance(it, dict):
                    parts.append(str(it.get("label") or ""))
                    parts.append(str(it.get("value") or ""))
        elif t == "entries":
            for it in sec.get("items") or []:
                if isinstance(it, dict):
                    parts.append(str(it.get("title") or ""))
                    parts.append(str(it.get("org") or ""))
                    for b in it.get("bullets") or []:
                        parts.append(str(b))
        elif t == "list":
            for it in sec.get("items") or []:
                if isinstance(it, str):
                    parts.append(it)
                elif isinstance(it, dict):
                    parts.append(str(it.get("text") or ""))
                    parts.append(str(it.get("meta") or ""))
                    parts.append(str(it.get("desc") or ""))
    return " \n ".join(parts).lower()


def apply_missing_keywords_to_resume_preview_data(
    resume_data: dict[str, Any],
    missing_keywords: list[str],
    *,
    max_keywords: int = _DEFAULT_MAX_KEYWORDS,
) -> tuple[dict[str, Any], list[str]]:
    """
    Deterministic injection of ATS missing keywords into LLM-produced resume JSON.
    Returns (deep_copy_with_injections, keywords_actually_added_in_order).
    """
    import copy

    data = copy.deepcopy(resume_data)
    sections = data.get("sections")
    if not isinstance(sections, list):
        data["sections"] = []
        sections = data["sections"]

    candidates: list[str] = []
    seen: set[str] = set()
    for raw in missing_keywords or []:
        if not isinstance(raw, str):
            continue
        k = raw.strip()
        if len(k) < 2 or len(k) > 80:
            continue
        low = k.lower()
        if low in seen:
            continue
        seen.add(low)
        blob = _resume_preview_data_blob(data)
        if _already_present(blob, k):
            continue
        candidates.append(k)
        if len(candidates) >= max_keywords:
            break

    added: list[str] = []
    if not candidates:
        return data, added

    def _ensure_skills_section_index() -> int:
        for i, sec in enumerate(sections):
            if isinstance(sec, dict) and sec.get("type") == "skills":
                if re.search(r"skill|technical|stack|tool", str(sec.get("title") or ""), re.I):
                    return i
        for i, sec in enumerate(sections):
            if isinstance(sec, dict) and sec.get("type") == "skills":
                return i
        sections.append({"type": "skills", "title": "Technical skills", "items": []})
        return len(sections) - 1

    # (sort_key desc, section_index, item_index) for entries with bullets
    entry_slots: list[tuple[int, int, int]] = []
    for si, sec in enumerate(sections):
        if not isinstance(sec, dict) or sec.get("type") != "entries":
            continue
        title = str(sec.get("title") or "")
        tl = title.lower()
        pr = 0
        if "experience" in tl or "employment" in tl or "intern" in tl or "work" in tl:
            pr = 3
        elif "project" in tl:
            pr = 2
        elif "achievement" in tl or "extra" in tl or "activity" in tl or "certif" in tl:
            pr = 1
        items = sec.get("items")
        if not isinstance(items, list):
            continue
        for ej, it in enumerate(items):
            if isinstance(it, dict) and isinstance(it.get("bullets"), list):
                entry_slots.append((pr, si, ej))
    entry_slots.sort(key=lambda x: -x[0])
    rot_narr = 0
    # Rotate wording so multiple JD keywords do not all read "Hands-on exposure to …".
    _narr_bullet_templates = (
        "Applied {kw} in coursework, projects, and analysis work.",
        "Used {kw} when building models, summaries, and stakeholder-facing outputs.",
        "Built familiarity with {kw} through end-to-end data analysis cycles.",
        "Incorporated {kw} in evaluation, iteration, and reporting across projects.",
        "Contributed with {kw} in team analysis tasks and deliverable reviews.",
        "Practiced {kw} in hands-on assignments and internship responsibilities.",
        "Referenced {kw} while interpreting findings and shaping recommendations.",
    )
    narr_tpl_i = 0

    for kw in candidates:
        blob = _resume_preview_data_blob(data)
        if _already_present(blob, kw):
            continue
        if _should_append_keyword_to_skills_list(kw):
            idx = _ensure_skills_section_index()
            sec = sections[idx]
            items = sec.setdefault("items", [])
            if not isinstance(items, list):
                sec["items"] = []
                items = sec["items"]
            items.append({"label": "", "value": kw})
            added.append(kw)
            continue

        placed = False
        if entry_slots:
            _, si, ej = entry_slots[rot_narr % len(entry_slots)]
            rot_narr += 1
            sec = sections[si]
            items = sec.get("items")
            if isinstance(items, list) and ej < len(items) and isinstance(items[ej], dict):
                block = items[ej]
                bullets = list(block.get("bullets") or [])
                if not any(kw.lower() in str(b).lower() for b in bullets):
                    tpl = _narr_bullet_templates[narr_tpl_i % len(_narr_bullet_templates)]
                    narr_tpl_i += 1
                    bullets.append(tpl.replace("{kw}", kw))
                    block["bullets"] = bullets
                    added.append(kw)
                    placed = True
        if not placed:
            idx = _ensure_skills_section_index()
            sec = sections[idx]
            items = sec.setdefault("items", [])
            if not isinstance(items, list):
                sec["items"] = []
                items = sec["items"]
            items.append({"label": "", "value": kw})
            added.append(kw)

    return data, added


def structured_to_preview_text(data: dict[str, Any]) -> str:
    """Plain-text preview for the UI (not LaTeX)."""
    lines: list[str] = []
    if data.get("name"):
        lines.append(str(data["name"]))
        lines.append("")
    if data.get("summary"):
        lines.append("SUMMARY")
        lines.append(str(data["summary"]))
        lines.append("")
    if data.get("skills"):
        lines.append("SKILLS")
        lines.append(", ".join(str(s) for s in data["skills"]))
        lines.append("")
    if data.get("experience"):
        lines.append("EXPERIENCE")
        for e in data["experience"]:
            if not isinstance(e, dict):
                continue
            lines.append(str(e.get("title") or ""))
            d = str(e.get("detail") or "").strip()
            if d:
                lines.append(d)
            lines.append("")
    if data.get("projects"):
        lines.append("PROJECTS")
        for p in data["projects"]:
            if not isinstance(p, dict):
                continue
            lines.append(str(p.get("name") or ""))
            d = str(p.get("description") or "").strip()
            if d:
                lines.append(d)
            lines.append("")
    if data.get("education"):
        lines.append("EDUCATION")
        lines.append(str(data["education"]))
        lines.append("")
    if data.get("extra"):
        lines.append("ADDITIONAL")
        for block in str(data["extra"]).split("\n\n"):
            b = block.strip()
            if b:
                lines.append(b)
                lines.append("")
    return "\n".join(lines).strip()


def _call_openai_mini(api_key: str, user_prompt: str, model: str) -> str:
    payload = json.dumps({
        "model": model or "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You only rewrite the given sentences. "
                    "Do not rewrite fully: only minimally enhance and insert the provided keywords where they fit. "
                    "Preserve the user's voice, order, and facts. Do not remove content. Do not invent employers, "
                    "dates, degrees, or metrics. Output plain text only, same number of paragraphs as input."
                ),
            },
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 1200,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        out = json.loads(resp.read().decode("utf-8"))
    return (out.get("choices") or [{}])[0].get("message", {}).get("content") or ""


def maybe_llm_enhance(
    data: dict[str, Any],
    keywords_subset: list[str],
    *,
    provider: str,
    api_key: str,
    model: str | None,
) -> dict[str, Any]:
    """
    Optional low-cost enhancement: one short LLM call. If anything fails, returns data unchanged.
    """
    if not api_key or provider not in ("openai", "openrouter"):
        return data

    import copy

    work = copy.deepcopy(data)
    kws = ", ".join(keywords_subset[:8])
    if not kws.strip():
        return work

    blocks = []
    if work.get("summary"):
        blocks.append(("SUMMARY", str(work["summary"])))
    for i, e in enumerate(work.get("experience") or []):
        if isinstance(e, dict) and (e.get("detail") or "").strip():
            blocks.append((f"EXPERIENCE_DETAIL_{i}", str(e["detail"])))
    for i, p in enumerate(work.get("projects") or []):
        if isinstance(p, dict) and (p.get("description") or "").strip():
            blocks.append((f"PROJECT_DESC_{i}", str(p["description"])))

    if not blocks:
        return work

    # One batched user message: labeled paragraphs
    labeled = "\n\n".join(f"[{label}]\n{text}" for label, text in blocks[:6])
    user_prompt = (
        f"Keywords to weave in naturally (not all required if awkward): {kws}\n\n"
        f"For each [LABEL] block below, reply with the same LABEL line followed by the improved text only.\n\n"
        f"{labeled}"
    )

    try:
        if provider == "openrouter":
            payload = json.dumps({
                "model": model or "openai/gpt-4o-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "Do not rewrite, only minimally enhance and insert keywords. "
                            "Keep the user's tone. Do not remove facts. Plain text only."
                        ),
                    },
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 1200,
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://openrouter.ai/api/v1/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                out = json.loads(resp.read().decode("utf-8"))
            raw = (out.get("choices") or [{}])[0].get("message", {}).get("content") or ""
        else:
            raw = _call_openai_mini(api_key, user_prompt, model or "gpt-4o-mini")
    except Exception:
        return work

    # Parse [LABEL] … blocks from the model output
    mapping: dict[str, str] = {}
    for m in re.finditer(r"(?ms)^\s*\[([^\]]+)\]\s*\n(.*?)(?=^\s*\[|\Z)", raw.strip()):
        mapping[m.group(1).strip()] = m.group(2).strip()

    if not mapping:
        return work

    if mapping.get("SUMMARY"):
        work["summary"] = mapping["SUMMARY"]
    exp_list = work.get("experience") or []
    for i in range(len(exp_list)):
        key = f"EXPERIENCE_DETAIL_{i}"
        if key in mapping and isinstance(exp_list[i], dict):
            exp_list[i]["detail"] = mapping[key]
    proj_list = work.get("projects") or []
    for i in range(len(proj_list)):
        key = f"PROJECT_DESC_{i}"
        if key in mapping and isinstance(proj_list[i], dict):
            proj_list[i]["description"] = mapping[key]

    return work


def enhance_with_optional_llm(
    data: dict[str, Any],
    added_keywords: list[str],
    llm_config: dict[str, Any] | None,
) -> dict[str, Any]:
    """If llm_config has useLlmEnhance + provider + api_key, run maybe_llm_enhance."""
    if not llm_config or not llm_config.get("useLlmEnhance"):
        return data
    provider = (llm_config.get("provider") or "").strip().lower()
    api_key = (llm_config.get("apiKey") or "").strip()
    if not api_key:
        return data
    if provider not in ("openai", "openrouter"):
        return data
    return maybe_llm_enhance(
        data,
        added_keywords,
        provider=provider,
        api_key=api_key,
        model=llm_config.get("model"),
    )


def _norm_provider(p: str) -> str:
    s = (p or "").strip().lower()
    if s in ("claude", "anthropic"):
        return "anthropic"
    if s in ("google", "google-gemini", "gemini"):
        return "gemini"
    if s in ("openai", "openrouter"):
        return s
    return s


def _parse_possible_json(raw: str) -> dict[str, Any] | None:
    """Best-effort JSON parse. Accepts markdown-fenced output."""
    s = (raw or "").strip()
    if not s:
        return None
    if s.startswith("```"):
        lines = s.split("\n")
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        s = "\n".join(lines).strip()
    try:
        out = json.loads(s)
        return out if isinstance(out, dict) else None
    except Exception:
        return None


def map_fields_with_optional_llm(
    data: dict[str, Any],
    resume_text: str,
    llm_config: dict[str, Any] | None,
    *,
    user_id: str | None = None,
) -> dict[str, Any]:
    """
    AI-only template-fill parser for the Fix-Resume preview JSON.

    IMPORTANT:
    - Uses the full extracted resume text as the only source of truth.
    - Does NOT depend on heuristic/regex-derived "extracted JSON" hints.
    - Fail-hard: raises on errors so the caller can return an error to the client.
    """
    if not llm_config or not llm_config.get("useLlmMapFields"):
        raise RuntimeError("AI mapping is required (useLlmMapFields not set).")

    provider = _norm_provider(str(llm_config.get("provider") or ""))
    api_key = str(llm_config.get("apiKey") or "").strip()
    model = str(llm_config.get("model") or "").strip() or None

    # Load saved key/model via userId when available.
    if (not api_key) and user_id:
        try:
            # Reuse the same DynamoDB schema as the ATS scorer.
            from ats_resume_scorer import get_user_llm_config  # type: ignore

            keys, models = get_user_llm_config(user_id)
            keys = keys or {}
            models = models or {}
            if provider:
                api_key = (keys.get(provider) or "").strip()
                if not model:
                    model = (models.get(provider) or "").strip() or None
            else:
                # Pick first available provider key (prefer cheaper/faster).
                for p in ("openai", "anthropic", "gemini", "openrouter"):
                    if (keys.get(p) or "").strip():
                        provider = p
                        api_key = (keys.get(p) or "").strip()
                        model = (models.get(p) or "").strip() or None
                        break
        except Exception as e:
            raise RuntimeError(f"Could not load saved LLM key: {e}") from e

    if not api_key or not provider:
        raise RuntimeError("No LLM API key available for AI mapping.")

    resume_slice = (resume_text or "").strip()
    if not resume_slice:
        raise RuntimeError("Resume text is empty; cannot run AI mapping.")
    resume_slice = resume_slice[:9000]

    prompt = (
        "You are filling a resume template object for an in-app preview.\n"
        "Input:\n"
        "- RESUME text (ground truth)\n\n"
        "Task:\n"
        "Return ONLY a single JSON object (no markdown, no extra text) that matches EXACTLY this schema:\n"
        "{\n"
        '  "name": string,\n'
        '  "email": string,\n'
        '  "phone": string,\n'
        '  "linkedIn": string,\n'
        '  "github": string,\n'
        '  "portfolio": string,\n'
        '  "summary": string,\n'
        '  "extra": string,\n'
        '  "education": [{"degree": string, "specialization": string, "institute": string, "year": string, "gpa": string}],\n'
        '  "experience": [{"title": string, "detail": string}],\n'
        '  "projects": [{"name": string, "description": string}],\n'
        '  "skills": string[]\n'
        "}\n\n"
        "Rules:\n"
        "- Use RESUME text as the only source of truth.\n"
        "- Prefer the candidate's personal email/phone; avoid recruiter/company/example/noreply.\n"
        "- If a field is unknown, return an empty string (\"\") (skills can be []).\n"
        "- Keep skills as deduplicated short tool/tech names (10–40 items if available).\n"
        "- Do NOT invent employers, dates, degrees, or links.\n"
        "- Projects: return ONE object per project. Do not merge multiple projects into a single description.\n"
        "  Each project's description should include only that project's bullets/summary.\n\n"
        f"RESUME:\n{resume_slice}"
    )

    raw = ""
    try:
        from ats_resume_scorer import (  # type: ignore
            _call_openai,
            _call_openrouter,
            _call_claude,
            _call_gemini,
        )

        if provider == "openai":
            raw = _call_openai(api_key, prompt, model)
        elif provider == "openrouter":
            raw = _call_openrouter(api_key, prompt, model)
        elif provider == "anthropic":
            raw = _call_claude(api_key, prompt, model)
        elif provider == "gemini":
            raw = _call_gemini(api_key, prompt, model)
        else:
            return data
    except Exception as e:
        raise RuntimeError(f"LLM request failed: {e}") from e

    obj = _parse_possible_json(raw)
    if not obj:
        raise RuntimeError("LLM returned invalid JSON for resume mapping.")

    # Validate and normalize output into the expected shape.
    out: dict[str, Any] = {}
    expected_str_keys = ("name", "email", "phone", "linkedIn", "github", "portfolio", "summary", "extra")
    for k in expected_str_keys:
        v = obj.get(k)
        if isinstance(v, str):
            out[k] = v.strip()
        else:
            out[k] = ""

    edu = obj.get("education")
    if isinstance(edu, list):
        edu_out: list[dict[str, str]] = []
        for it in edu:
            if not isinstance(it, dict):
                continue
            degree = it.get("degree")
            spec = it.get("specialization")
            inst = it.get("institute")
            year = it.get("year")
            gpa = it.get("gpa")
            if all(isinstance(x, str) for x in (degree, spec, inst, year, gpa)):
                edu_out.append(
                    {
                        "degree": " ".join(degree.split()).strip(),
                        "specialization": " ".join(spec.split()).strip(),
                        "institute": " ".join(inst.split()).strip(),
                        "year": " ".join(year.split()).strip(),
                        "gpa": " ".join(gpa.split()).strip(),
                    }
                )
            if len(edu_out) >= 15:
                break
        out["education"] = edu_out
    else:
        out["education"] = []

    # Normalize experience/projects lists.
    exp = obj.get("experience")
    if isinstance(exp, list):
        exp_out: list[dict[str, str]] = []
        for it in exp:
            if not isinstance(it, dict):
                continue
            t = it.get("title")
            d = it.get("detail")
            if isinstance(t, str) and isinstance(d, str):
                tt = " ".join(t.split()).strip()
                dd = d.strip()
                if tt or dd:
                    exp_out.append({"title": tt, "detail": dd})
            if len(exp_out) >= 30:
                break
        out["experience"] = exp_out
    else:
        out["experience"] = []

    projs = obj.get("projects")
    if isinstance(projs, list):
        proj_out: list[dict[str, str]] = []
        for it in projs:
            if not isinstance(it, dict):
                continue
            n = it.get("name")
            d = it.get("description")
            if isinstance(n, str) and isinstance(d, str):
                nn = " ".join(n.split()).strip()
                dd = d.strip()
                if nn or dd:
                    proj_out.append({"name": nn, "description": dd})
            if len(proj_out) >= 30:
                break
        out["projects"] = proj_out
    else:
        out["projects"] = []

    skills = obj.get("skills")
    if isinstance(skills, list):
        clean: list[str] = []
        seen = set()
        for x in skills:
            if not isinstance(x, str):
                continue
            s = " ".join(x.split()).strip()
            if not s:
                continue
            key = s.lower()
            if key in seen:
                continue
            seen.add(key)
            clean.append(s)
            if len(clean) >= 80:
                break
        out["skills"] = clean
    else:
        out["skills"] = []

    # Overlay keyword-injected content later; return AI-parsed template JSON now.
    return out
