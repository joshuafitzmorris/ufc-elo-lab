variable "aws_account_id" {
  description = "AWS account ID - Terraform will fail if you're on the wrong account"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "ufc_elo"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "ufcelo"
  sensitive   = true
}

variable "container_cpu" {
  description = "ECS task CPU units (1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "container_memory" {
  description = "ECS task memory in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "ecr_repository_url" {
  description = "ECR repository URL for the app image"
  type        = string
  default     = ""
}
