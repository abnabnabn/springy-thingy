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
  TARGET_DOMAIN=$(tsm get springy.terraform.domain_name || true)
else
  echo "TSM not found, relying on native environment variables..."
  TARGET_DOMAIN="$TF_VAR_domain_name"
fi

if [ -z "$TARGET_DOMAIN" ]; then
  echo "Error: Target domain name is missing. Please set TF_VAR_domain_name manually or verify 'springy.domain_name' exists in TSM."
  exit 1
fi

echo "Syncing files to s3://${TARGET_DOMAIN}..."
aws s3 sync dist/ "s3://${TARGET_DOMAIN}" --delete

echo "Invalidating CloudFront cache..."
# Use AWS CLI to find the Distribution ID that matches the target domain
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Aliases.Items!=null] | [?contains(Aliases.Items, '${TARGET_DOMAIN}')].Id | [0]" --output text 2>/dev/null || echo "")

if [ "$DIST_ID" != "None" ] && [ -n "$DIST_ID" ]; then
  aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"
  echo "Invalidation triggered successfully for Distribution $DIST_ID."
else
  echo "Warning: Could not automatically determine CloudFront Distribution ID for ${TARGET_DOMAIN}. Cache invalidation skipped."
fi
