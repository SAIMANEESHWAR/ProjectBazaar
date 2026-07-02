# Build portfolio-builder Lambda zip with PDF libraries (Linux x86_64 for AWS Lambda)
# Run from repo root:  powershell -ExecutionPolicy Bypass -File lambda/portfolio-builder/build_lambda_zip.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Pkg = Join-Path $PSScriptRoot "package"
$Zip = Join-Path $PSScriptRoot "portfolio-builder.zip"

Write-Host "Cleaning package folder..."
if (Test-Path $Pkg) { Remove-Item $Pkg -Recurse -Force }
New-Item -ItemType Directory -Path $Pkg | Out-Null

Write-Host "Installing PDF libs for Lambda Python 3.12 (Linux x86_64)..."
# PyPDF2 + pdfminer.six only (boto3 is in the Lambda runtime; skip pdfplumber/Pillow to keep zip small)
python -m pip install `
  PyPDF2 pdfminer.six `
  -t $Pkg `
  --platform manylinux2014_x86_64 `
  --python-version 3.12 `
  --only-binary=:all: `
  --upgrade `
  --quiet
if ($LASTEXITCODE -ne 0) { throw "pip install failed" }

Write-Host "Copying source files..."
$files = @(
  "handler.py", "resume_extract.py", "llm_enrich.py", "regex_fallback.py",
  "vercel_deploy.py", "history.py"
)
foreach ($f in $files) {
  Copy-Item (Join-Path $PSScriptRoot $f) $Pkg
}
Copy-Item (Join-Path $Root "feature_entitlement.py") $Pkg
Copy-Item (Join-Path $Root "resume_text_extract.py") $Pkg -ErrorAction SilentlyContinue
Copy-Item (Join-Path $PSScriptRoot "templates") (Join-Path $Pkg "templates") -Recurse

Write-Host "Creating zip..."
if (Test-Path $Zip) { Remove-Item $Zip -Force }
python -c @"
import os, zipfile
pkg, zip_path = r'$Pkg', r'$Zip'
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk(pkg):
        if '__pycache__' in root:
            continue
        for f in files:
            full = os.path.join(root, f)
            zf.write(full, os.path.relpath(full, pkg).replace('\\\\', '/'))
"@
if ($LASTEXITCODE -ne 0) { throw "zip creation failed" }

Write-Host ""
Write-Host "Done! Upload this zip to AWS Lambda:"
Write-Host "  $Zip"
Write-Host ""
Write-Host "Lambda settings:"
Write-Host "  Handler: handler.lambda_handler"
Write-Host "  Runtime: Python 3.12"
Write-Host "  Architecture: x86_64"
Write-Host "  Timeout: 300 sec, Memory: 512 MB+"
