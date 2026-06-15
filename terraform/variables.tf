variable "aws_region" {
  description = "The AWS region to deploy the S3 bucket in"
  type        = string
}

variable "domain_name" {
  description = "The custom domain for the game, which also acts as the S3 bucket name"
  type        = string
}

variable "certificate_domain" {
  description = "The domain of the ACM TLS certificate to attach to CloudFront (must be in us-east-1)"
  type        = string
}

variable "app_name" {
  description = "The short name of the application (e.g., springy)"
  type        = string
}
