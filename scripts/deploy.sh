#!/bin/bash
set -e

# Ensure we are in the project root, regardless of where the script was invoked from
cd "$(dirname "$0")/.."

echo "Building production assets..."
npm run build

TARGET_DOMAIN=""

if command -v tsm >/dev/null 2>&1; then
  echo "Fetching domain name securely from TSM..."
  # Use || true so set -e doesn't instantly crash the script if the secret is missing, 
  # allowing our custom error check below to handle it gracefully.
  TARGET_DOMAIN=$(tsm get springy.domain_name || true)
else
  echo "TSM not found, relying on native environment variables..."
  TARGET_DOMAIN="$TF_VAR_domain_name"
fi

if [ -z "$TARGET_DOMAIN" ]; then
  echo "Error: Target domain name is missing. Please set TF_VAR_domain_name manually or verify 'springy.domain_name' exists in TSM."
  exit 1
fi

aws s3 sync dist/ "s3://${TARGET_DOMAIN}" --delete
