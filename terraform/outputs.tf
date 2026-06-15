output "game_url" {
  description = "The HTTPS custom domain URL for the game"
  value       = "https://${var.domain_name}"
}

output "cloudfront_domain_name" {
  description = "The raw CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "bucket_arn" {
  description = "The ARN of the S3 bucket"
  value       = aws_s3_bucket.game_bucket.arn
}
