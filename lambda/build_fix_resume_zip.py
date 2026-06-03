"""
Build fix_resume_lambda.zip for a dedicated Fix My Resume Lambda.

Uses fix_resume_requirements.txt (PyPDF2, pdfminer.six, PyMuPDF, python-docx). PDF is stdlib-only
in resume_fix_pdf_simple.py (no fpdf2 / PIL).
Run from lambda/:  python build_fix_resume_zip.py
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REQ = ROOT / "fix_resume_requirements.txt"
HANDLER = ROOT / "fix_resume_handler.py"
MODULES = [
    "resume_text_extract.py",
    "resume_fix_parse.py",
    "resume_fix_engine.py",
    "resume_fix_latex.py",
    "resume_fix_pdf_simple.py",
    "resume_fix_pipeline.py",
]
TEMPLATE = ROOT / "templates" / "resume_fix_template.tex"
OUT = ROOT / "fix_resume_lambda.zip"
PKG = ROOT / "package_fix_resume"

LAMBDA_PLATFORM = os.environ.get("LAMBDA_ZIP_PLATFORM", "manylinux2014_x86_64")


def main() -> None:
    if not REQ.is_file() or not HANDLER.is_file():
        sys.exit("Run from the lambda/ directory.")
    if PKG.exists():
        shutil.rmtree(PKG)
    PKG.mkdir(parents=True)
    env = {**os.environ, "PIP_USER": "0", "PYTHONUSERBASE": ""}
    cmd = [
        sys.executable,
        "-m",
        "pip",
        "install",
        "--upgrade",
        "--no-cache-dir",
    ]
    if sys.platform != "linux" or os.environ.get("FORCE_LAMBDA_MANYLINUX") == "1":
        cmd.extend(
            [
                "--platform",
                LAMBDA_PLATFORM,
                "--implementation",
                "cp",
                "--python-version",
                "3.11",
                "--only-binary=:all:",
            ]
        )
    cmd.extend(["-r", str(REQ), "-t", str(PKG)])
    subprocess.check_call(cmd, env=env)
    # Strip accidental Pillow/PIL from transitive deps or old installs (broken PIL on Lambda breaks importers).
    for name in ("PIL", "Pillow.libs"):
        p = PKG / name
        if p.exists():
            shutil.rmtree(p, ignore_errors=True)
    for p in PKG.glob("Pillow-*.dist-info"):
        shutil.rmtree(p, ignore_errors=True)
    for p in PKG.glob("pillow-*.dist-info"):
        shutil.rmtree(p, ignore_errors=True)
    if OUT.exists():
        OUT.unlink()
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in PKG.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(PKG).as_posix())
        zf.write(HANDLER, "fix_resume_handler.py")
        for name in MODULES:
            p = ROOT / name
            if p.is_file():
                zf.write(p, name)
        if TEMPLATE.is_file():
            zf.write(TEMPLATE, "templates/resume_fix_template.tex")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
    print("Lambda handler: fix_resume_handler.lambda_handler")


if __name__ == "__main__":
    main()
