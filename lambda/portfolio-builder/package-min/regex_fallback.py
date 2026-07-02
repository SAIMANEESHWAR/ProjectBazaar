"""Lightweight regex resume parser — fallback when LLM JSON parse fails."""

from __future__ import annotations

import re
from typing import Any, Dict, List


def extract_portfolio_data(resume_text: str, user_email: str = "") -> Dict[str, Any]:
    text = resume_text or ""
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

    email_m = re.search(r"[\w.-]+@[\w.-]+\.\w+", text)
    email = email_m.group(0) if email_m else user_email or ""
    phone_m = re.search(r"[\+]?[\d\s\-\(\)]{10,}", text)
    phone = phone_m.group(0).strip() if phone_m else ""

    name = _extract_name(lines)
    title = _extract_title(text, lines)
    location = _extract_location(text)
    skills = _extract_skills(text)
    experience = _extract_experience(text)
    education = _extract_education(text)
    projects = _extract_projects(text)
    bio = _extract_summary(text) or f"{title} with hands-on experience in software and technology."

    gh = _extract_url(text, r"github\.com/[\w-]+")
    li = _extract_url(text, r"linkedin\.com/in/[\w-]+")

    return {
        "personal": {
            "name": name,
            "title": title,
            "tagline": f"{title} | {location}" if location else title,
            "email": email,
            "phone": phone,
            "location": location,
            "bio": bio,
        },
        "about": {
            "headline": "About Me",
            "description": bio,
            "highlights": _extract_highlights(text, skills),
        },
        "education": education,
        "experience": experience,
        "projects": projects,
        "skills": skills,
        "certifications": [],
        "links": {
            "github": f"https://{gh}" if gh else "",
            "linkedin": f"https://{li}" if li else "",
            "twitter": "",
            "website": "",
            "email": f"mailto:{email}" if email else "",
        },
    }


def _extract_name(lines: List[str]) -> str:
    for ln in lines[:8]:
        if 2 <= len(ln.split()) <= 4 and ln[0].isupper() and "@" not in ln:
            if not re.search(r"\d{3,}", ln):
                return ln
    return "Your Name"


def _extract_title(text: str, lines: List[str]) -> str:
    titles = [
        "software engineer", "developer", "full stack", "frontend", "backend",
        "data scientist", "product manager", "designer", "devops", "analyst",
    ]
    for ln in lines[1:6]:
        low = ln.lower()
        if any(t in low for t in titles) and len(ln) < 80:
            return ln
    for t in titles:
        m = re.search(rf"({t}[^.\n]{{0,40}})", text, re.I)
        if m:
            return m.group(1).strip().title()
    return "Professional"


def _extract_location(text: str) -> str:
    m = re.search(
        r"([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)",
        text,
    )
    return m.group(1).strip() if m else ""


def _extract_url(text: str, pattern: str) -> str:
    m = re.search(pattern, text, re.I)
    return m.group(0) if m else ""


def _extract_skills(text: str) -> Dict[str, List[str]]:
    categories = {
        "frontend": ["react", "vue", "angular", "javascript", "typescript", "html", "css", "tailwind"],
        "backend": ["python", "node", "java", "go", "django", "flask", "fastapi", "express"],
        "database": ["sql", "postgresql", "mysql", "mongodb", "redis", "dynamodb"],
        "devops": ["aws", "docker", "kubernetes", "ci/cd", "terraform", "vercel"],
        "other": ["git", "agile", "rest", "graphql", "linux"],
    }
    low = text.lower()
    out: Dict[str, List[str]] = {}
    for cat, kws in categories.items():
        found = [k.title() if k.islower() else k for k in kws if k in low]
        if found:
            out[cat] = found[:12]
    return out


def _extract_experience(text: str) -> List[Dict[str, Any]]:
    items = []
    blocks = re.split(r"(?=\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\b)", text)
    for block in blocks[:6]:
        if len(block) < 40:
            continue
        period_m = re.search(
            r"((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^.]{0,30}\d{4}[^.]{0,30})",
            block,
            re.I,
        )
        lines = [l.strip() for l in block.split("\n") if l.strip()]
        if len(lines) < 2:
            continue
        items.append({
            "company": lines[1][:60] if len(lines) > 1 else "",
            "title": lines[0][:60],
            "period": period_m.group(1) if period_m else "",
            "description": " ".join(lines[2:4])[:300] if len(lines) > 2 else "",
            "highlights": [],
        })
    return items[:5]


def _extract_education(text: str) -> List[Dict[str, Any]]:
    items = []
    for m in re.finditer(
        r"(B\.?S\.?|B\.?Tech|M\.?S\.?|M\.?Tech|Bachelor|Master|Ph\.?D)[^.]{0,120}",
        text,
        re.I,
    ):
        chunk = m.group(0)
        year_m = re.search(r"(20\d{2}|19\d{2})", chunk)
        items.append({
            "degree": chunk[:80],
            "institution": "",
            "year": year_m.group(1) if year_m else "",
        })
    return items[:3]


def _extract_projects(text: str) -> List[Dict[str, Any]]:
    items = []
    for m in re.finditer(r"(?i)(project[s]?:?\s*)([^\n]{5,80})", text):
        name = m.group(2).strip()
        items.append({"name": name, "description": "", "technologies": [], "url": "", "github": ""})
    return items[:4]


def _extract_summary(text: str) -> str:
    m = re.search(r"(?i)(summary|profile|objective)[:\s]*([^\n]{40,400})", text)
    return m.group(2).strip() if m else ""


def _extract_highlights(text: str, skills: Dict[str, List]) -> List[str]:
    highlights = []
    for cat, lst in skills.items():
        if lst:
            highlights.append(f"{cat.title()}: {len(lst)}+ skills")
    exp = re.search(r"(\d+)\+?\s*years?\s*(?:of)?\s*experience", text, re.I)
    if exp:
        highlights.append(f"{exp.group(1)}+ years experience")
    return highlights[:5] or ["Problem solver", "Team player", "Fast learner"]
