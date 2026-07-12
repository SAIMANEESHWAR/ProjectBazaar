#!/usr/bin/env bash
set -euo pipefail

# Deploy admin auth Lambdas (ap-south-2).
# Usage: ./deploy_admin_lambdas.sh [admin|login|all]

REGION="${AWS_REGION:-ap-south-2}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
TARGET="${1:-all}"

deploy_admin_users() {
  local build_dir
  build_dir="$(mktemp -d)"
  cp "$ROOT/get_all_users_for_admin.py" "$build_dir/lambda_function.py"
  cp "$ROOT/admin_password_crypto.py" "$build_dir/"
  (
    cd "$build_dir"
    zip -q deploy.zip lambda_function.py admin_password_crypto.py
  )
  aws lambda update-function-code \
    --region "$REGION" \
    --function-name "Get_All_users_for_admin" \
    --zip-file "fileb://$build_dir/deploy.zip"
  rm -rf "$build_dir"
  echo "Deployed Get_All_users_for_admin in $REGION"
}

deploy_login() {
  local build_dir
  build_dir="$(mktemp -d)"
  cp "$ROOT/login_handler.py" "$build_dir/lambda_function.py"
  for f in admin_password_crypto.py email_service.py rate_limiter.py google_sheets_sync.py; do
    if [[ -f "$ROOT/$f" ]]; then
      cp "$ROOT/$f" "$build_dir/"
    fi
  done
  (
    cd "$build_dir"
    zip -q deploy.zip ./*
  )
  aws lambda update-function-code \
    --region "$REGION" \
    --function-name "User_login_signup" \
    --zip-file "fileb://$build_dir/deploy.zip"
  rm -rf "$build_dir"
  echo "Deployed User_login_signup in $REGION"
}

case "$TARGET" in
  admin) deploy_admin_users ;;
  login) deploy_login ;;
  all)
    deploy_admin_users
    deploy_login
    ;;
  *)
    echo "Usage: $0 [admin|login|all]" >&2
    exit 1
    ;;
esac
