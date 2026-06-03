"""
LaTeX resume rendering: load a static template, substitute escaped placeholders, compile with pdflatex/latexmk.

LaTeX source is never produced by an LLM — only string substitution from structured JSON.
"""

from __future__ import annotations

import os
import re
import subprocess
import tempfile
from typing import Any

_TEMPLATE_NAME = "resume_fix_template.tex"


def _template_path() -> str:
    return os.path.join(os.path.dirname(__file__), "templates", _TEMPLATE_NAME)


def latex_escape(text: str) -> str:
    """Escape characters that break LaTeX; keeps readable ASCII-ish output."""
    if text is None:
        return ""
    s = str(text)
    repl = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(repl.get(ch, ch) for ch in s)


def _skills_items(skills: list[Any]) -> str:
    lines: list[str] = []
    for s in skills or []:
        t = latex_escape(str(s).strip())
        if t:
            lines.append(f"\\item {t}")
    if not lines:
        lines.append(r"\item \textit{(see experience and projects)}")
    return "\n".join(lines)


def _summary_block(summary: str) -> str:
    s = (summary or "").strip()
    if not s:
        return ""
    body = latex_escape(s)
    return f"\\section*{{Summary}}\n{body}\n"


def _experience_block(experience: list[dict[str, Any]]) -> str:
    if not experience:
        return r"\textit{(none parsed)}"
    parts: list[str] = []
    for e in experience:
        if not isinstance(e, dict):
            continue
        title = latex_escape(str(e.get("title") or "").strip())
        detail = latex_escape(str(e.get("detail") or "").strip())
        if title:
            parts.append(f"\\subsection*{{{title}}}")
        if detail:
            parts.append(detail + r"\par\vspace{0.35em}")
    return "\n".join(parts) if parts else r"\textit{(none parsed)}"


def _projects_block(projects: list[dict[str, Any]]) -> str:
    if not projects:
        return r"\textit{(none parsed)}"
    parts: list[str] = []
    for p in projects:
        if not isinstance(p, dict):
            continue
        name = latex_escape(str(p.get("name") or "").strip())
        desc = latex_escape(str(p.get("description") or "").strip())
        if name:
            parts.append(f"\\subsection*{{{name}}}")
        if desc:
            parts.append(desc + r"\par\vspace{0.35em}")
    return "\n".join(parts) if parts else r"\textit{(none parsed)}"


def _education_block(education: str) -> str:
    s = (education or "").strip()
    return latex_escape(s) if s else r"\textit{(none parsed)}"


def _extra_block(extra: str) -> str:
    s = (extra or "").strip()
    if not s:
        return ""
    return f"\\section*{{Additional}}\n{latex_escape(s)}\n"


def build_latex_document(data: dict[str, Any]) -> str:
    """Fill the bundled template with escaped content from improved JSON."""
    path = _template_path()
    with open(path, "r", encoding="utf-8") as f:
        tpl = f.read()

    name = latex_escape(str(data.get("name") or "Resume").strip() or "Resume")
    summary_block = _summary_block(str(data.get("summary") or ""))
    skills_items = _skills_items(data.get("skills") or [])
    exp_block = _experience_block(data.get("experience") or [])
    proj_block = _projects_block(data.get("projects") or [])
    edu_block = _education_block(str(data.get("education") or ""))
    extra_block = _extra_block(str(data.get("extra") or ""))

    out = tpl
    out = out.replace("{{NAME}}", name)
    out = out.replace("{{SUMMARY_BLOCK}}", summary_block)
    out = out.replace("{{SKILLS_ITEMS}}", skills_items)
    out = out.replace("{{EXPERIENCE_BLOCK}}", exp_block)
    out = out.replace("{{PROJECTS_BLOCK}}", proj_block)
    out = out.replace("{{EDUCATION_BLOCK}}", edu_block)
    out = out.replace("{{EXTRA_BLOCK}}", extra_block)
    return out


def compile_latex_to_pdf(tex_source: str) -> tuple[bytes | None, str | None]:
    """
    Run latexmk or pdflatex in a temp directory. Returns (pdf_bytes, error_message).
    On Lambda, TeX is usually absent — caller should handle None pdf and still return JSON preview.
    """
    with tempfile.TemporaryDirectory(prefix="pb_fix_resume_") as tmp:
        tex_path = os.path.join(tmp, "resume.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(tex_source)

        attempts = [
            ["latexmk", "-pdf", "-interaction=nonstopmode", "-halt-on-error", "resume.tex"],
            ["pdflatex", "-interaction=nonstopmode", "-halt-on-error", "resume.tex"],
        ]
        last_err = "TeX not installed"
        for cmd in attempts:
            try:
                proc = subprocess.run(
                    cmd,
                    cwd=tmp,
                    capture_output=True,
                    text=True,
                    timeout=120,
                    check=False,
                    env={**os.environ, "TEXMFVAR": tmp},
                )
                pdf_path = os.path.join(tmp, "resume.pdf")
                if os.path.isfile(pdf_path) and os.path.getsize(pdf_path) > 200:
                    with open(pdf_path, "rb") as pdf:
                        return pdf.read(), None
                tail = (proc.stderr or proc.stdout or "")[-800:]
                last_err = tail.strip() or f"command failed ({proc.returncode})"
            except FileNotFoundError:
                last_err = f"{' '.join(cmd[:1])} not found"
                continue
            except subprocess.TimeoutExpired:
                return None, "LaTeX compile timed out"

        return None, last_err
