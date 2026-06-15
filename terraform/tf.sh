#!/bin/bash
set -e

# Navigate to the directory where the script is located
cd "$(dirname "$0")"

USE_LOCAL_BACKEND=false

# Parse the optional --local-backend flag
if [ "$1" = "--local-backend" ]; then
  USE_LOCAL_BACKEND=true
  shift
fi

COMMAND=$1

if [ -z "$COMMAND" ]; then
  echo "Usage: ./tf.sh [--local-backend] <terraform-command> [args]"
  exit 1
fi

USE_TSM=false
if command -v tsm >/dev/null 2>&1; then
  USE_TSM=true
fi

# Manage override.tf state based on the init command
if [ "$COMMAND" = "init" ]; then
  if [ "$USE_LOCAL_BACKEND" = "true" ]; then
    echo "Local backend requested. Creating override.tf..."
    cat <<EOF > override.tf
terraform {
  backend "local" {}
}
EOF
  else
    # If remote backend is initialized, ensure override.tf is removed
    rm -f override.tf
  fi
else
  # For non-init commands, automatically infer local backend if override.tf exists
  if [ -f "override.tf" ]; then
    USE_LOCAL_BACKEND=true
  fi
fi

if [ "$USE_TSM" = "false" ]; then
  echo "TSM CLI not found. Falling back to environment variables."
  MISSING=0
  
  # Parse tsm.env to find which variables are expected
  while IFS='=' read -r key value || [ -n "$key" ]; do
    key=$(echo "$key" | tr -d ' \r\t')
    if [[ -n "$key" && "$key" != \#* ]]; then
      # Skip checking backend variables if using local backend
      if [ "$USE_LOCAL_BACKEND" = "true" ] && [[ "$key" == TF_BACKEND_* ]]; then
        continue
      fi
      
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
  if [ "$USE_LOCAL_BACKEND" = "true" ]; then
    echo "Initializing Terraform using LOCAL backend..."
    if [ "$USE_TSM" = "true" ]; then
      tsm run -- terraform init "$@"
    else
      terraform init "$@"
    fi
  else
    echo "Initializing Terraform using REMOTE S3 backend..."
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
