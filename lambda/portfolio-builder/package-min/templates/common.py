"""Shared data normalization for portfolio HTML templates."""

from typing import Any, Dict, List


def extract_common_data(data: Dict[str, Any]) -> Dict[str, Any]:
    personal = data.get("personal", {}) or {}
    about = data.get("about", {}) or {}
    skills = data.get("skills", {}) or {}
    experience = data.get("experience", []) or []
    education = data.get("education", []) or []
    projects = data.get("projects", []) or []
    links = data.get("links", {}) or {}
    certifications = data.get("certifications", []) or []

    return {
        "name": personal.get("name", "Your Name"),
        "title": personal.get("title", "Professional"),
        "tagline": personal.get("tagline", ""),
        "bio": personal.get("bio", about.get("description", "")),
        "email": personal.get("email", ""),
        "phone": personal.get("phone", ""),
        "location": personal.get("location", ""),
        "about_headline": about.get("headline", "About Me"),
        "about_description": about.get("description", ""),
        "highlights": about.get("highlights", []) or [],
        "skills": skills,
        "experience": experience[:6],
        "education": education[:4],
        "projects": projects[:6],
        "certifications": certifications[:5],
        "github": links.get("github", ""),
        "linkedin": links.get("linkedin", ""),
        "twitter": links.get("twitter", ""),
        "website": links.get("website", ""),
    }


def skill_names(skill_list: List) -> List[str]:
    out = []
    for s in skill_list or []:
        if isinstance(s, dict):
            out.append(str(s.get("name", "")))
        else:
            out.append(str(s))
    return [n for n in out if n]


def exp_highlights(exp: Dict[str, Any]) -> str:
    bullets = exp.get("highlights") or []
    desc = exp.get("description", "")
    if bullets:
        items = "".join(f"<li>{b}</li>" for b in bullets[:5])
        return f"<ul class='bullets'>{items}</ul>"
    if desc:
        return f"<p>{desc}</p>"
    return ""
