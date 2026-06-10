"""
Build live_mock_interview.zip for AWS Lambda.

Includes live_mock_interview_handler.py + feature_entitlement.py (required for POST / trial consume).

Run from lambda/:  python build_live_mock_interview_zip.py
"""
from __future__ import annotations

import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HANDLER = ROOT / "live_mock_interview_handler.py"
ENTITLEMENT = ROOT / "feature_entitlement.py"
OUT = ROOT / "live_mock_interview.zip"


def main() -> None:
    if not HANDLER.is_file():
        sys.exit("Missing live_mock_interview_handler.py")
    if not ENTITLEMENT.is_file():
        sys.exit("Missing feature_entitlement.py — copy from lambda/ before zipping.")
    if OUT.exists():
        OUT.unlink()
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(HANDLER, HANDLER.name)
        zf.write(ENTITLEMENT, ENTITLEMENT.name)
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
