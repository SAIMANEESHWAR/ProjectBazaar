#!/usr/bin/env bash
# Apply CORS to the prep notes bucket (optional if using upload_sd_media via Lambda).
set -euo pipefail

BUCKET="projectbazaar-admin-coursesandnotes"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Applying CORS to s3://${BUCKET} ..."
aws s3api put-bucket-cors \
  --bucket "${BUCKET}" \
  --cors-configuration "file://${SCRIPT_DIR}/s3-prep-notes-cors.json"

echo "Done. Verify with: aws s3api get-bucket-cors --bucket ${BUCKET}"
