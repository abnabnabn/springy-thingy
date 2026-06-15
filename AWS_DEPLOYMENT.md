# Secure HTTPS Deployment to AWS S3 & CloudFront

This guide details how to deploy the game, route a custom domain (e.g., `game.yourdomain.com`), and secure it with an SSL certificate using AWS CloudFront, entirely through Terraform Infrastructure as Code (IaC).

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
- **ACM SSL Certificate**: You **must** have an existing, issued SSL/TLS certificate in AWS Certificate Manager (ACM) matching your `TF_VAR_certificate_domain` (e.g., `*.yourdomain.com`).
  > [!IMPORTANT]
  > Because CloudFront is a global service, this certificate **must** be created in the `us-east-1` (N. Virginia) region, regardless of where your S3 bucket lives. Terraform will look up this existing certificate during deployment; it does not create it for you.

## 2. Infrastructure Configuration

### State Management: Remote vs Local Backend

Terraform must store a "state file" to remember what infrastructure it has deployed. This project supports two modes:

1. **Remote S3 Backend (Recommended)**: Stores the state securely in an AWS S3 bucket and uses DynamoDB for state locking to prevent concurrent modifications. This is the industry standard for production environments and team collaboration.
2. **Local Backend (Testing / Solo Dev)**: Stores the state directly on your laptop in a file called `terraform.tfstate`. This is perfect for a quick, one-off deployment but risks total state loss if your local file is deleted.

### Required Variables

To keep hardcoded values out of the codebase, deployment configuration must be provided via environment variables.

**Project Variables:**

| Environment Variable | TSM Key | Description | Example |
| :--- | :--- | :--- | :--- |
| `TF_VAR_app_name` | `springy.appname` | The short name of your application | `game` |
| `TF_VAR_aws_region` | `springy.aws_region` | The AWS region where your new game S3 bucket will live | `us-east-1` |
| `TF_VAR_domain_name` | `springy.domain_name` | The custom domain where players will access the game | `game.yourdomain.com` |
| `TF_VAR_certificate_domain` | `springy.certificate_domain` | The domain used for your ACM SSL certificate | `*.yourdomain.com` |

> [!NOTE]
> If you are using the **Remote Backend**, you must provide *all* of the variables. If you are using the **Local Backend**, you *only* need to provide the Project Variables project variables above, and can skip the variables below..

**Remote Backend Variables (Ignore if using Local Backend):**

| Environment Variable | TSM Key | Description | Example |
| :--- | :--- | :--- | :--- |
| `TF_BACKEND_BUCKET` | `terraform.backend.bucket` | The name of the S3 bucket used to store the Terraform state | `my-state-bucket` |
| `TF_BACKEND_KEY` | `terraform.backend.key` | The path/filename inside the bucket | `game/terraform.tfstate` |
| `TF_BACKEND_REGION` | `terraform.backend.region` | The AWS region where your backend bucket/table live | `us-east-1` |
| `TF_BACKEND_DYNAMODB_TABLE` | `terraform.backend.dynamodb_table` | The DynamoDB table name used for state locking | `terraform-locks` |
| `TF_BACKEND_ENCRYPT` | `terraform.backend.encrypt` | Whether to encrypt the state at rest | `true` |

### How to Provide the Variables

You have two options for injecting these variables into Terraform:

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

Because we inject dynamic backend configuration, you **must** use the provided wrapper script rather than raw Terraform commands. The script will halt and throw an error if you missed any required variables for your chosen backend.

**Option 1: Initialize with a Remote Backend (Recommended)**
```bash
cd terraform
./tf.sh init
```

**Option 2: Initialize with a Local Backend**
You can explicitly bypass the remote backend requirements by passing the `--local-backend` flag. This safely generates a temporary, unversioned `override.tf` file to route state to your local disk.
```bash
cd terraform
./tf.sh --local-backend init
```

### Step 2: Apply Infrastructure

Run the apply command via the wrapper script. Terraform will present a summary of the S3 bucket, CloudFront distribution, and policies it will create.

```bash
./tf.sh apply
```
*(Note: You do not need to specify `--local-backend` here. The script automatically remembers if you initialized locally!)*

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

Open your custom domain URL (e.g., `https://game.yourdomain.com`) in your browser. Once your DNS provider propagates the new CNAME record globally, the game is live!
