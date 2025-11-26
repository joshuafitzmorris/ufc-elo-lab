terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 backend for state
  # backend "s3" {
  #   bucket         = "ufc-elo-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "ufc-elo-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  # SAFETY: Terraform will FAIL if you're on the wrong account
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = "ufc-elo"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name_prefix = "ufc-elo-${var.environment}"
}
