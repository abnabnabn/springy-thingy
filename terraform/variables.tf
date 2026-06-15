variable "aws_region" {
  description = "The AWS region to deploy the S3 bucket in"
  type        = string
}

variable "domain_name" {
  description = "The custom domain for the game, which also acts as the S3 bucket name"
  type        = string
}

variable "certificate_domain" {
  description = "The domain name for the ACM certificate (e.g., *.abn.cx)"
  type        = string
}
