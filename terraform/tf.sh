#!/bin/bash
set -e

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

COMMAND=$1

if [ -z "$COMMAND" ]; then
  echo "Usage: ./tf.sh <terraform-command> [args]"
  exit 1
fi

USE_TSM=false
if command -v tsm >/dev/null 2>&1; then
  USE_TSM=true
fi

if [ "$USE_TSM" = "false" ]; then
  echo "TSM CLI not found. Falling back to environment variables."
  MISSING=0
  
  # Parse tsm.env to find which variables are expected
  while IFS='=' read -r key value || [ -n "$key" ]; do
    key=$(echo "$key" | tr -d ' \r\t')
    if [[ -n "$key" && "$key" != \#* ]]; then
      if [ -z "${!key}" ]; then
        echo "Error: Required environment variable '$key' is missing."
        MISSING=1
      fi
    fi
  done < tsm.env
  
  if [ "$MISSING" -eq 1 ]; then
    echo "Please set the missing environment variables above, or install TSM to inject them automatically."
    exit 1
  fi
fi

if [ "$COMMAND" = "init" ]; then
  if [ "$USE_TSM" = "true" ]; then
    echo "Initializing Terraform using tsm run..."
    tsm run -- sh -c 'terraform init \
      -backend-config="bucket=${TF_BACKEND_BUCKET}" \
      -backend-config="key=${TF_BACKEND_KEY}" \
      -backend-config="region=${TF_BACKEND_REGION}" \
      -backend-config="dynamodb_table=${TF_BACKEND_DYNAMODB_TABLE}" \
      -backend-config="encrypt=${TF_BACKEND_ENCRYPT}" \
      "$@"' _ "${@:2}"
  else
    echo "Initializing Terraform using native environment variables..."
    terraform init \
      -backend-config="bucket=${TF_BACKEND_BUCKET}" \
      -backend-config="key=${TF_BACKEND_KEY}" \
      -backend-config="region=${TF_BACKEND_REGION}" \
      -backend-config="dynamodb_table=${TF_BACKEND_DYNAMODB_TABLE}" \
      -backend-config="encrypt=${TF_BACKEND_ENCRYPT}" \
      "${@:2}"
  fi
else
  if [ "$USE_TSM" = "true" ]; then
    echo "Running terraform $@ using tsm run..."
    tsm run -- terraform "$@"
  else
    echo "Running terraform $@ using native environment variables..."
    terraform "$@"
  fi
fi
