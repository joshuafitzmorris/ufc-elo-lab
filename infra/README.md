# UFC ELO Infrastructure

Deploy UFC ELO to Google Cloud Platform (Cloud Run + Cloud SQL).

## Prerequisites

1. [Terraform](https://terraform.io) >= 1.5.0
2. [gcloud CLI](https://cloud.google.com/sdk/gcloud) authenticated
3. A GCP project with billing enabled
4. Docker installed locally

## Quick Deploy

### 1. Configure Terraform

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 2. Initialize and Apply Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

This creates:
- Cloud SQL PostgreSQL instance
- Artifact Registry repository
- Cloud Run service (initially with placeholder image)

### 3. Build and Push Docker Image

```bash
# Set variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"

# Configure Docker for Artifact Registry
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push (from project root)
cd ../..
docker build --platform linux/amd64 -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/ufc-elo/app:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/ufc-elo/app:latest
```

### 4. Deploy to Cloud Run

```bash
# Get database URL from Terraform output
cd infra/terraform
export DATABASE_URL=$(terraform output -raw database_connection)

# Deploy
gcloud run deploy ufc-elo \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/ufc-elo/app:latest \
  --region ${REGION} \
  --set-env-vars "DATABASE_URL=${DATABASE_URL},NODE_ENV=production" \
  --allow-unauthenticated
```

### 5. Run Database Migrations and Seed

```bash
# Connect to Cloud Run instance or run locally with DATABASE_URL
npx prisma migrate deploy
npx prisma db seed
```

## Costs

Approximate monthly costs (us-central1):
- Cloud SQL db-f1-micro: ~$10/month
- Cloud Run: Pay per use (~$0 for low traffic)
- Artifact Registry: ~$0.10/GB stored

**Total estimate:** ~$10-15/month for low traffic

## Updating

```bash
# Rebuild and push new image
docker build --platform linux/amd64 -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/ufc-elo/app:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/ufc-elo/app:latest

# Cloud Run auto-deploys latest image, or force update:
gcloud run services update ufc-elo --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/ufc-elo/app:latest --region ${REGION}
```

## Cleanup

```bash
cd infra/terraform
terraform destroy
```

⚠️ This deletes all data including the database!
