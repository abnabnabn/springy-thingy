terraform {
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# CloudFront requires ACM certificates to be in us-east-1.
# This secondary provider explicitly points to us-east-1 to fetch the global cert.
provider "aws" {
  alias  = "useast1"
  region = "us-east-1"
}

# The S3 Bucket (Now Private)
resource "aws_s3_bucket" "game_bucket" {
  bucket = var.domain_name
}

# Look up the existing ACM Certificate (Must be in us-east-1)
data "aws_acm_certificate" "cert" {
  provider = aws.useast1
  domain   = var.certificate_domain
  statuses = ["ISSUED"]
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "oac" {
  name                              = "springy-game-oac"
  description                       = "OAC for Springy Thingy Game Bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name              = aws_s3_bucket.game_bucket.bucket_regional_domain_name
    origin_id                = "S3Origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = [var.domain_name]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = data.aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# Bucket policy allowing ONLY CloudFront to read objects (OAC)
resource "aws_s3_bucket_policy" "game_bucket_policy" {
  bucket = aws_s3_bucket.game_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal",
        Effect    = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.game_bucket.arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn
          }
        }
      }
    ]
  })
}

