"""Build mock_assessment.zip for AWS Lambda.

Run from lambda/:  python build_mock_assessment_zip.py

AWS function mock_assessment_handler is configured with handler lambda_function.lambda_handler,
so this script packages mock_assessment_handler.py as lambda_function.py inside the zip.

Alternative: keep mock_assessment_handler.py in the zip and set handler to
mock_assessment_handler.lambda_handler in the Lambda console.
"""
from __future__ import annotations

import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "mock_assessment_handler.py"
OUT = ROOT / "mock_assessment.zip"
# Entry module name must match Lambda handler setting (lambda_function.lambda_handler)
ZIP_ENTRY = "lambda_function.py"


def main() -> None:
    if not SOURCE.is_file():
        sys.exit("Missing mock_assessment_handler.py")
    if OUT.exists():
        OUT.unlink()
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.write(SOURCE, ZIP_ENTRY)
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
    print(f"  {SOURCE.name} -> {ZIP_ENTRY} (handler: lambda_function.lambda_handler)")


if __name__ == "__main__":
    main()
