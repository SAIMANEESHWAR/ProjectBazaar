"""
Build ats_resume_scorer.zip for AWS Lambda: dependencies + ats_resume_scorer.py + resume_text_extract.py.

Fix My Resume is a separate Lambda — use build_fix_resume_zip.py.

Run from repo root or lambda/:  python build_ats_zip.py
Requires: Python 3.11+ (match Lambda runtime), pip.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REQ = ROOT / "ats_resume_scorer_requirements.txt"
HANDLER = ROOT / "ats_resume_scorer.py"
SHARED = ROOT / "resume_text_extract.py"
OUT = ROOT / "ats_resume_scorer.zip"
PKG = ROOT / "package"

# Lambda Python 3.11 x86_64 needs Linux wheels. Building on Windows/macOS otherwise pulls *.whl
# that fail at import time on Lambda (e.g. PyMuPDF).
LAMBDA_PLATFORM = os.environ.get("LAMBDA_ZIP_PLATFORM", "manylinux2014_x86_64")


def main() -> None:
    if not REQ.is_file() or not HANDLER.is_file():
        sys.exit("Run this script from the lambda/ directory (next to ats_resume_scorer.py).")
    if PKG.exists():
        shutil.rmtree(PKG)
    PKG.mkdir(parents=True)
    # Avoid "Can not combine '--user' and '--target'" when pip.ini enables user installs (common on Windows).
    env = {**os.environ, "PIP_USER": "0", "PYTHONUSERBASE": ""}
    cmd: list[str] = [
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
    if OUT.exists():
        OUT.unlink()
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in PKG.rglob("*"):
            if path.is_file():
                arc = path.relative_to(PKG).as_posix()
                zf.write(path, arc)
        zf.write(HANDLER, "ats_resume_scorer.py")
        if SHARED.is_file():
            zf.write(SHARED, "resume_text_extract.py")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
