"""
Resume text → structured JSON for the Fix My Resume pipeline.

Uses plain text already extracted from PDF/DOCX (see extract_text_from_bytes in ats_resume_scorer).
Heuristic sectioning only — no LLM, preserves original wording in each block.
"""

from __future__ import annotations

import re
from typing import Any

# Headings we treat as section boundaries (case-insensitive, line-anchored).
# Allow compound headers like "CERTIFICATIONS & WORKSHOPS" (not only exact single-title lines).
_SECTION_RE = re.compile(
    r"^\s*(?:"
    r"EXPERIENCE|WORK\s+EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s+EXPERIENCE|"
    r"EDUCATION|ACADEMIC|QUALIFICATIONS|"
    r"SKILLS|TECHNICAL\s+SKILLS|CORE\s+COMPETENCIES|"
    r"PROJECTS?|PERSONAL\s+PROJECTS?|ACADEMIC\s+PROJECTS?|"
    r"SUMMARY|PROFILE|OBJECTIVE|ABOUT|"
    r"CERTIFICATIONS?(?:\s*[&]\s*[A-Za-z][A-Za-z0-9\s&]*)*|"
    r"WORKSHOPS?(?:\s*[&]\s*[A-Za-z][A-Za-z0-9\s&]*)*|"
    r"AWARDS?|ACHIEVEMENTS?|PUBLICATIONS?|HONOURS?|HONORS?|"
    r"EXTRA(?:\s*[-–]\s*|\s+)CURRICULAR(?:\s+ACTIVITIES)?|"
    r"CO[- ]?CURRICULAR|VOLUNTEER|VOLUNTEERING|LEADERSHIP\s+AND\s+ACTIVITIES"
    r")\s*:?\s*$",
    re.I | re.M,
)


def _norm_lines(text: str) -> list[str]:
    if not text or not str(text).strip():
        return []
    lines = [ln.rstrip() for ln in str(text).replace("\r\n", "\n").split("\n")]
    out = []
    for ln in lines:
        s = ln.strip()
        if s:
            out.append(s)
    return out


def _section_bucket(header_line: str) -> str:
    h = header_line.strip().lower()
    if any(x in h for x in ("experience", "employment", "professional")):
        return "experience"
    if any(x in h for x in ("education", "academic", "qualification")) and "project" not in h:
        return "education"
    if "skill" in h or "competenc" in h:
        return "skills"
    if "project" in h:
        return "projects"
    if any(x in h for x in ("summary", "profile", "objective", "about")):
        return "summary"
    if any(x in h for x in ("certification", "workshop")):
        return "certifications"
    if any(x in h for x in ("award", "achievement", "publication", "honour", "honor")):
        return "awards"
    if any(x in h for x in ("volunteer", "curricular", "leadership and activities")):
        return "activities"
    return "preamble"


def _split_sections(lines: list[str]) -> dict[str, list[str]]:
    """Map section bucket → body lines until the next section heading."""
    sections: dict[str, list[str]] = {}
    current = "preamble"
    sections[current] = []

    for ln in lines:
        if _SECTION_RE.match(ln):
            current = _section_bucket(ln)
            sections.setdefault(current, [])
            continue
        sections.setdefault(current, []).append(ln)
    return sections


def _preamble_name(preamble_lines: list[str]) -> str:
    if not preamble_lines:
        return ""
    # First line is usually the name; second line sometimes title/headline.
    name = preamble_lines[0].strip()
    if len(preamble_lines) >= 2 and len(name) < 60:
        second = preamble_lines[1].strip()
        if len(second) < 90 and not re.search(r"[@•|]", second):
            return f"{name} — {second}"
    return name


def _join_extra_sections(sec: dict[str, list[str]]) -> str:
    """Keep certifications, awards, and activities as separate blocks in one string."""
    parts: list[str] = []
    for key in ("certifications", "awards", "activities"):
        lines = sec.get(key) or []
        if lines:
            parts.append(" ".join(lines).strip())
    return "\n\n".join(p for p in parts if p)


def _parse_skills_lines(skill_lines: list[str]) -> list[str]:
    raw = " ".join(skill_lines)
    parts = re.split(r"[,;|•·\n]+", raw)
    skills = []
    seen = set()
    for p in parts:
        s = re.sub(r"\s+", " ", p).strip()
        if len(s) < 2:
            continue
        low = s.lower()
        if low in seen:
            continue
        seen.add(low)
        skills.append(s)
    return skills


def _split_experience_blocks(lines: list[str]) -> list[dict[str, Any]]:
    """Split experience section into job-sized blocks (blank-line separated)."""
    if not lines:
        return []
    blocks: list[list[str]] = []
    cur: list[str] = []
    for ln in lines:
        if not ln.strip():
            if cur:
                blocks.append(cur)
                cur = []
            continue
        cur.append(ln)
    if cur:
        blocks.append(cur)

    out: list[dict[str, Any]] = []
    for b in blocks:
        title = b[0] if b else ""
        detail = " ".join(b[1:]) if len(b) > 1 else ""
        out.append({"title": title, "detail": detail})
    return out


def _split_project_blocks(lines: list[str]) -> list[dict[str, Any]]:
    """Same blank-line blocking as experience; first line of each block is the project title."""
    if not lines:
        return []
    blocks: list[list[str]] = []
    cur: list[str] = []
    for ln in lines:
        if not ln.strip():
            if cur:
                blocks.append(cur)
                cur = []
            continue
        cur.append(ln)
    if cur:
        blocks.append(cur)

    projects: list[dict[str, Any]] = []
    for b in blocks:
        title = re.sub(r"^[-•*]\s+", "", b[0]).strip()
        detail = " ".join(re.sub(r"^[-•*]\s+", "", x).strip() for x in b[1:]) if len(b) > 1 else ""
        projects.append({"name": title, "description": detail})
    return projects


def parse_resume_to_structured_json(resume_text: str) -> dict[str, Any]:
    """
    Build:
    {
      "name": str,
      "summary": str,
      "skills": [str, ...],
      "experience": [{"title": str, "detail": str}, ...],
      "projects": [{"name": str, "description": str}, ...],
      "education": str,
      "extra": str
    }
    """
    lines = _norm_lines(resume_text)
    if not lines:
        return {
            "name": "",
            "summary": "",
            "skills": [],
            "experience": [],
            "projects": [],
            "education": "",
            "extra": "",
        }

    sec = _split_sections(lines)
    preamble = sec.get("preamble") or []
    name = _preamble_name(preamble)

    summary_lines = sec.get("summary") or []
    summary = " ".join(summary_lines).strip()

    skills = _parse_skills_lines(sec.get("skills") or [])

    exp_lines = sec.get("experience") or []
    experience = _split_experience_blocks(exp_lines)

    proj_lines = sec.get("projects") or []
    projects = _split_project_blocks(proj_lines)
    if not projects and proj_lines:
        projects = [{"name": proj_lines[0], "description": " ".join(proj_lines[1:]).strip()}]

    education = " ".join(sec.get("education") or []).strip()
    extra = _join_extra_sections(sec)

    return {
        "name": name,
        "summary": summary,
        "skills": skills,
        "experience": experience,
        "projects": projects,
        "education": education,
        "extra": extra,
    }
