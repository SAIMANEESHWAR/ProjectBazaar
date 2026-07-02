#!/usr/bin/env bash
set -euo pipefail

# Deploy company_compare_handler Lambda code (ap-south-2).
# Usage:
#   ./deploy.sh <function-name>
# Example:
#   ./deploy.sh company_compare_handler

FUNCTION_NAME="${1:-}"
REGION="${AWS_REGION:-ap-south-2}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$(mktemp -d)"

if [[ -z "$FUNCTION_NAME" ]]; then
  echo "Usage: $0 <lambda-function-name>" >&2
  echo "Find the function in AWS Console → Lambda → Functions (search 'company_compare')." >&2
  exit 1
fi

cp "$ROOT/company_compare_handler.py" "$BUILD_DIR/"
(
  cd "$BUILD_DIR"
  zip -q company_compare_handler.zip company_compare_handler.py
)

aws lambda update-function-code \
  --region "$REGION" \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$BUILD_DIR/company_compare_handler.zip"

rm -rf "$BUILD_DIR"
echo "Deployed $FUNCTION_NAME in $REGION"
