# Secure HTTPS Deployment to AWS S3 & CloudFront

This guide details how to deploy your game, route a custom domain (e.g., `game.yourdomain.com`), and secure it with an SSL certificate using AWS CloudFront, entirely through Terraform Infrastructure as Code (IaC).

By using Terraform, you **do not** need to log into the AWS Console to configure hosting. Terraform handles provisioning the private S3 Bucket, creating a global CloudFront Distribution with Origin Access Control (OAC), and attaching your existing ACM SSL certificate.

## 1. Prerequisites

Before running the deployment scripts, ensure you have:
- **AWS CLI**: Installed and configured locally (`aws configure`).
  - *If you are using a specific AWS profile (e.g., `your-aws-profile`), make sure you export it in your terminal before running any commands:*
    ```bash
    export AWS_PROFILE="your-aws-profile" # Linux/macOS
    $env:AWS_PROFILE="your-aws-profile"   # Windows PowerShell
    ```
- **Terraform**: Installed locally.
- **Node.js**: Installed locally to build the game assets.

## 2. Infrastructure Configuration

To keep hardcoded values out of the codebase, this project expects deployment configuration to be provided via environment variables.

### Required Variables

You must provide the following variables. If you use Tiny Secrets Manager, the required secret keys are also listed below (this mapping is defined in `terraform/tsm.env`):

**Project Variables:**

| Environment Variable | TSM Key | Description | Example |
| :--- | :--- | :--- | :--- |
| `TF_VAR_aws_region` | `springy.aws_region` | The AWS region where your new game S3 bucket will live | `us-east-1` |
| `TF_VAR_domain_name` | `springy.domain_name` | The custom domain where players will access the game | `game.yourdomain.com` |
| `TF_VAR_certificate_domain` | `springy.certificate_domain` | The domain used for your ACM SSL certificate | `*.yourdomain.com` |

**Remote Backend Variables (State Management):**

| Environment Variable | TSM Key | Description | Example |
| :--- | :--- | :--- | :--- |
| `TF_BACKEND_BUCKET` | `terraform.backend.bucket` | The name of the S3 bucket used to store the Terraform state | `my-state-bucket` |
| `TF_BACKEND_KEY` | `terraform.backend.key` | The path/filename inside the bucket | `game/terraform.tfstate` |
| `TF_BACKEND_REGION` | `terraform.backend.region` | The AWS region where your backend bucket/table live | `us-east-1` |
| `TF_BACKEND_DYNAMODB_TABLE` | `terraform.backend.dynamodb_table` | The DynamoDB table name used for state locking | `terraform-locks` |
| `TF_BACKEND_ENCRYPT` | `terraform.backend.encrypt` | Whether to encrypt the state at rest | `true` |

### How to Provide the Variables

You have two options for providing these to Terraform:

**Option A: Tiny Secrets Manager (Recommended)**
We highly recommend using [Tiny Secrets Manager (TSM)](https://github.com/abnabnabn/tiny-secrets-manager) to securely manage and inject these. 
If `tsm` is installed on your system, the deployment scripts will automatically read `terraform/tsm.env` and fetch the mapped secrets directly from your secure vault, eliminating the need to set them manually in your shell.

**Option B: Standard Environment Variables**
If you do not wish to use TSM, you can simply export all of the required environment variables in your shell or CI/CD pipeline environment before running the scripts.
```bash
export TF_VAR_domain_name="game.yourdomain.com"
export TF_BACKEND_BUCKET="my-state-bucket"
# ... export all others
```

---

### Step 1: Initialize Terraform

Because we inject dynamic backend configuration, you **must** use the provided wrapper script rather than raw Terraform commands.

```bash
cd terraform
./tf.sh init
```
*(If you are missing any required variables, the script will gracefully catch it and let you know!)*

### Step 2: Apply Infrastructure

Run the apply command via the wrapper script. Terraform will present a summary of the S3 bucket, CloudFront distribution, and policies it will create.
```bash
./tf.sh apply
```
Type `yes` when prompted. Upon completion, you will see a `game_url` output. **Copy this URL.**

> [!WARNING]
> CloudFront distributions deploy globally to hundreds of Edge locations. The initial deployment may take anywhere from 3 to 5 minutes to complete. This is normal AWS behavior!

## 3. Game Deployment

Now that the infrastructure and DNS routing exist, you need to compile and upload the actual game files. We have automated this step.

1. Return to the project root:
   ```bash
   cd ..
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Run the automated deploy script:
   ```bash
   npm run deploy
   ```
   *This command runs `vite build` to compile the production assets into `dist/`, and then uses `aws s3 sync` to upload them directly to your domain's bucket.*

## 4. Manual DNS Configuration

This Terraform configuration assumes your DNS is managed outside of AWS (e.g., Cloudflare, Namecheap), so it cannot automate the final DNS routing step.

Once Terraform finishes, look at the terminal output for a value called `cloudfront_domain_name` (it will look something like `d111111abcdef8.cloudfront.net`).

Log into your DNS provider and create a **CNAME** record:
- **Name**: `game` (or whatever subdomain you are using)
- **Target**: `d111111abcdef8.cloudfront.net` (your exact CloudFront output)

## 5. Play!

Open your custom domain URL (e.g., `https://game.yourdomain.com`) in your browser. Once your DNS provider propagates the new CNAME record globally, your game is live!
