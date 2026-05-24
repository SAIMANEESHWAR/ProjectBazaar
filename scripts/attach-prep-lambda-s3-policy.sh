#!/usr/bin/env bash
# Attach S3 upload permissions to the prep_admin_handler Lambda execution role.
#
# Usage:
#   LAMBDA_ROLE_NAME=your-role-name ./scripts/attach-prep-lambda-s3-policy.sh
#
# Find the role name in AWS Console:
#   Lambda → prep_admin_handler → Configuration → Permissions → Execution role
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICY_FILE="${SCRIPT_DIR}/iam/prep-lambda-s3-policy.json"
POLICY_NAME="PrepAdminS3MediaUpload"
REGION="${AWS_REGION:-ap-south-2}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"

if [[ -z "${LAMBDA_ROLE_NAME:-}" ]]; then
  echo "Fetching role from Lambda function prep_admin_handler ..."
  ROLE_ARN="$(aws lambda get-function-configuration \
    --function-name prep_admin_handler \
    --region "${REGION}" \
    --query Role \
    --output text 2>/dev/null || true)"
  if [[ -n "${ROLE_ARN}" && "${ROLE_ARN}" != "None" ]]; then
    LAMBDA_ROLE_NAME="${ROLE_ARN##*/}"
  fi
fi

if [[ -z "${LAMBDA_ROLE_NAME:-}" ]]; then
  echo "Error: set LAMBDA_ROLE_NAME to the prep_admin_handler execution role name."
  echo "Example: LAMBDA_ROLE_NAME=prep_admin_handler-role-abc123 $0"
  exit 1
fi

POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

echo "Creating/updating IAM policy ${POLICY_NAME} ..."
if aws iam get-policy --policy-arn "${POLICY_ARN}" >/dev/null 2>&1; then
  VERSION="$(aws iam create-policy-version \
    --policy-arn "${POLICY_ARN}" \
    --policy-document "file://${POLICY_FILE}" \
    --set-as-default \
    --query 'PolicyVersion.VersionId' \
    --output text)"
  echo "Updated policy version ${VERSION}"
else
  aws iam create-policy \
    --policy-name "${POLICY_NAME}" \
    --policy-document "file://${POLICY_FILE}" \
    --description "Prep admin Lambda S3 uploads for system-design and notes"
  echo "Created policy ${POLICY_ARN}"
fi

echo "Attaching policy to role ${LAMBDA_ROLE_NAME} ..."
aws iam attach-role-policy \
  --role-name "${LAMBDA_ROLE_NAME}" \
  --policy-arn "${POLICY_ARN}"

echo "Done."
echo "Verify: aws iam list-attached-role-policies --role-name ${LAMBDA_ROLE_NAME}"
