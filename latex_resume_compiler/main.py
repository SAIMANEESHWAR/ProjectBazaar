#!/usr/bin/env python3
"""
CLI: render structured résumé JSON into LaTeX (Jinja2) and compile with pdflatex.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, select_autoescape

SKILL_KEY_LABELS: list[tuple[str, str]] = [
    ("languages", "Languages & Frameworks"),
    ("databases", "Databases"),
    ("libraries", "Libraries"),
    ("tools", "Tools"),
    ("web", "Web Development"),
    ("soft", "Soft Skills"),
]


def escape_latex(text: str | None) -> str:
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


def latex_href_url(url: str) -> str:
    return str(url).strip().replace("#", r"\#").replace("%", r"\%").replace("_", r"\_")


def _digits_for_tel(phone: str) -> str:
    return re.sub(r"[^\d+]", "", phone) or phone.strip()


def _display_url(url: str) -> str:
    u = str(url).strip()
    return re.sub(r"^https?://(www\.)?", "", u, flags=re.I)


def load_data(file_path: str | Path) -> dict[str, Any]:
    path = Path(file_path)
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _normalize_education(rows: Any) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    if not isinstance(rows, list):
        return out
    for r in rows:
        if not isinstance(r, dict):
            continue
        out.append(
            {
                "degree": str(r.get("degree") or ""),
                "specialization": str(r.get("specialization") or ""),
                "institute": str(r.get("institute") or ""),
                "year": str(r.get("year") or ""),
                "cpi": str(r.get("cpi") or r.get("grade") or ""),
            }
        )
    return out


def _normalize_projects(items: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    if not isinstance(items, list):
        return out
    for p in items:
        if not isinstance(p, dict):
            continue
        title = str(p.get("title") or p.get("name") or "")
        pts = p.get("points") or p.get("bullets") or []
        if not isinstance(pts, list):
            pts = []
        pts = [str(x).strip() for x in pts if str(x).strip()]
        out.append(
            {
                "title": title,
                "date": str(p.get("date") or p.get("when") or "").strip(),
                "points": pts,
            }
        )
    return out


def _skill_rows(skills: Any) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    if not isinstance(skills, dict):
        return rows
    for key, label in SKILL_KEY_LABELS:
        val = skills.get(key)
        if val is None:
            continue
        s = str(val).strip()
        if s:
            rows.append({"category": label, "text": s})
    return rows


def _prepare_context(data: dict[str, Any]) -> dict[str, Any]:
    name = str(data.get("name") or "").strip()
    email = str(data.get("email") or "").strip()
    phone = str(data.get("phone") or "").strip()
    linkedin = str(data.get("linkedin") or "").strip()
    github = str(data.get("github") or "").strip()
    portfolio = str(data.get("portfolio") or "").strip()

    ctx: dict[str, Any] = {
        "name": name,
        "title": str(data.get("title") or "").strip(),
        "college": str(data.get("college") or "").strip(),
        "branch": str(data.get("branch") or "").strip(),
        "summary": str(data.get("summary") or "").strip(),
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "github": github,
        "portfolio": portfolio,
        "education": _normalize_education(data.get("education")),
        "skill_rows": _skill_rows(data.get("skills")),
        "projects": _normalize_projects(data.get("projects")),
        "certifications": [str(x).strip() for x in (data.get("certifications") or []) if str(x).strip()],
        "achievements": [str(x).strip() for x in (data.get("achievements") or []) if str(x).strip()],
        "activities": [str(x).strip() for x in (data.get("activities") or []) if str(x).strip()],
        "email_href": latex_href_url(f"mailto:{email}") if email else "",
        "phone_href": latex_href_url(f"tel:{_digits_for_tel(phone)}") if phone else "",
        "linkedin_href": latex_href_url(linkedin) if linkedin else "",
        "github_href": latex_href_url(github) if github else "",
        "portfolio_href": latex_href_url(portfolio) if portfolio else "",
        "linkedin_display": _display_url(linkedin) if linkedin else "",
        "github_display": _display_url(github) if github else "",
        "portfolio_display": _display_url(portfolio) if portfolio else "",
    }
    return ctx


def render_template(data: dict[str, Any], template_dir: Path, output_tex: Path) -> None:
    ctx = _prepare_context(data)
    env = Environment(
        loader=FileSystemLoader(str(template_dir)),
        autoescape=select_autoescape(enabled_extensions=()),
    )
    env.filters["latex"] = escape_latex
    tpl = env.get_template("resume.tex.j2")
    tex = tpl.render(**ctx)
    output_tex.parent.mkdir(parents=True, exist_ok=True)
    output_tex.write_text(tex, encoding="utf-8")


def compile_pdf(
    work_dir: Path,
    tex_filename: str = "output.tex",
    jobname: str = "resume",
    *,
    passes: int = 2,
) -> tuple[bool, str]:
    tex_path = work_dir / tex_filename
    if not tex_path.is_file():
        return False, f"Missing {tex_path}"

    pdflatex = shutil.which("pdflatex")
    if not pdflatex:
        return False, "pdflatex not found in PATH"

    cmd = [
        pdflatex,
        "-interaction=nonstopmode",
        "-halt-on-error",
        f"-output-directory={work_dir}",
        f"-jobname={jobname}",
        str(tex_path),
    ]
    last_err = ""
    for _ in range(passes):
        proc = subprocess.run(
            cmd,
            cwd=work_dir,
            capture_output=True,
            text=True,
            timeout=120,
            check=False,
        )
        pdf_path = work_dir / f"{jobname}.pdf"
        if proc.returncode != 0:
            tail = (proc.stdout or "") + "\n" + (proc.stderr or "")
            last_err = tail.strip()[-2000:] or f"pdflatex exit {proc.returncode}"
        if pdf_path.is_file() and pdf_path.stat().st_size > 200:
            return True, str(pdf_path.resolve())

    return False, last_err or "PDF not produced"


def main() -> int:
    parser = argparse.ArgumentParser(description="Render résumé JSON to LaTeX and compile PDF.")
    parser.add_argument(
        "json_path",
        nargs="?",
        default="sample_resume.json",
        help="Path to résumé JSON (default: sample_resume.json)",
    )
    parser.add_argument(
        "-o",
        "--out-dir",
        default=".",
        help="Directory for output.tex and resume.pdf",
    )
    args = parser.parse_args()

    base = Path(__file__).resolve().parent
    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    template_dir = base / "templates"
    output_tex = out_dir / "output.tex"

    try:
        data = load_data(args.json_path)
    except FileNotFoundError:
        print(f"✗ File not found: {args.json_path}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as e:
        print(f"✗ Invalid JSON: {e}", file=sys.stderr)
        return 1

    try:
        render_template(data, template_dir, output_tex)
    except Exception as e:
        print(f"✗ Template render failed: {e}", file=sys.stderr)
        return 1

    print("✔ Template rendered →", output_tex.resolve())

    ok, msg = compile_pdf(out_dir, tex_filename="output.tex", jobname="resume")
    if ok:
        print("✔ PDF generated →", msg)
        return 0

    print(f"✗ PDF generation failed:\n{msg}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
