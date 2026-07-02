"""
Build subscription_lambda.zip for AWS Lambda UserSubscriptions_handler.

Bundles reportlab + subscription_handler (as lambda_function.py), email_service,
feature_entitlement, and subscription_invoice.

Run from lambda/:  python build_subscription_zip.py
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REQ = ROOT / "requirements-resume-pdf.txt"
HANDLER_SRC = ROOT / "subscription_handler.py"
OUT = ROOT / "subscription_lambda.zip"
PKG = ROOT / "package-subscription"
SHARED_MODULES = (
    ROOT / "email_service.py",
    ROOT / "feature_entitlement.py",
    ROOT / "subscription_invoice.py",
)
INVOICE_ASSETS = ROOT / "invoice_assets"
LAMBDA_PLATFORM = os.environ.get("LAMBDA_ZIP_PLATFORM", "manylinux2014_aarch64")
LAMBDA_PYTHON_VERSION = os.environ.get("LAMBDA_PYTHON_VERSION", "3.11")


def main() -> None:
    if not REQ.is_file() or not HANDLER_SRC.is_file():
        sys.exit("Run from lambda/ (requirements-resume-pdf.txt and subscription_handler.py required).")
    if PKG.exists():
        shutil.rmtree(PKG)
    PKG.mkdir(parents=True)

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
                LAMBDA_PYTHON_VERSION,
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
                zf.write(path, path.relative_to(PKG).as_posix())
        # Deployed Lambda handler is lambda_function.lambda_handler
        zf.write(HANDLER_SRC, "lambda_function.py")
        for mod in SHARED_MODULES:
            if mod.is_file():
                zf.write(mod, mod.name)
            else:
                print(f"warning: missing {mod.name}")
        if INVOICE_ASSETS.is_dir():
            for asset in INVOICE_ASSETS.iterdir():
                if asset.is_file():
                    zf.write(asset, f"invoice_assets/{asset.name}")
    print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
