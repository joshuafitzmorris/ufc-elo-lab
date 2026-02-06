# UFC ELO Deployment Guide

Quick guide to get UFC ELO live on GCP Cloud Run.

## Prerequisites

- GCP account with billing enabled
- `gcloud` CLI installed and authenticated
- Domain (optional, can use Cloud Run URL)

## Step 1: GCP Project Setup

```bash
# Create project (or use existing)
gcloud projects create ufc-elo-lab --name="UFC ELO Lab"
gcloud config set project ufc-elo-lab

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

## Step 2: Create Artifact Registry

```bash
gcloud artifacts repositories create ufc-elo \
  --repository-format=docker \
  --location=us-central1 \
  --description="UFC ELO Docker images"
```

## Step 3: Create Cloud SQL Instance

```bash
# Create PostgreSQL instance
gcloud sql instances create ufc-elo-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create ufc_elo --instance=ufc-elo-db

# Create user
gcloud sql users create ufc_elo_user \
  --instance=ufc-elo-db \
  --password=YOUR_SECURE_PASSWORD
```

## Step 4: Create Secrets

```bash
# Database URL
echo -n "postgresql://ufc_elo_user:YOUR_PASSWORD@/ufc_elo?host=/cloudsql/ufc-elo-lab:us-central1:ufc-elo-db" | \
  gcloud secrets create database-url --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding database-url \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 5: Build & Push Image

```bash
# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build image
docker build --platform linux/amd64 \
  -t us-central1-docker.pkg.dev/ufc-elo-lab/ufc-elo/ufc-elo-web:latest \
  .

# Push image
docker push us-central1-docker.pkg.dev/ufc-elo-lab/ufc-elo/ufc-elo-web:latest
```

## Step 6: Deploy to Cloud Run

```bash
gcloud run deploy ufc-elo-web \
  --image us-central1-docker.pkg.dev/ufc-elo-lab/ufc-elo/ufc-elo-web:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets=DATABASE_URL=database-url:latest \
  --set-env-vars=NODE_ENV=production \
  --add-cloudsql-instances=ufc-elo-lab:us-central1:ufc-elo-db
```

## Step 7: Seed Database

```bash
# Connect to Cloud SQL
gcloud sql connect ufc-elo-db --user=ufc_elo_user

# Run migrations (from local with DATABASE_URL pointing to Cloud SQL)
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Seed data
DATABASE_URL="postgresql://..." npx prisma db seed
```

## Step 8: Set Up GitHub Actions (CI/CD)

1. Create a service account:
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"
```

2. Grant permissions:
```bash
gcloud projects add-iam-policy-binding ufc-elo-lab \
  --member="serviceAccount:github-actions@ufc-elo-lab.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ufc-elo-lab \
  --member="serviceAccount:github-actions@ufc-elo-lab.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding ufc-elo-lab \
  --member="serviceAccount:github-actions@ufc-elo-lab.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

3. Create key:
```bash
gcloud iam service-accounts keys create gcp-key.json \
  --iam-account=github-actions@ufc-elo-lab.iam.gserviceaccount.com
```

4. Add to GitHub:
   - Go to repo Settings → Secrets → Actions
   - Add `GCP_SA_KEY` with contents of `gcp-key.json`

## Step 9: Google AdSense

1. Go to https://adsense.google.com/start
2. Sign up with your Google account
3. Add your domain
4. Get your `ca-pub-XXXXXXX` ID
5. Tell Gandalf the ID to add to the layout

Approval takes 1-3 days.

## Step 10: Custom Domain (Optional)

```bash
gcloud run domain-mappings create \
  --service ufc-elo-web \
  --domain your-domain.com \
  --region us-central1
```

Then add the CNAME record to your DNS.

---

## Quick Commands

```bash
# View logs
gcloud run logs read --service=ufc-elo-web --region=us-central1

# Get service URL
gcloud run services describe ufc-elo-web --region=us-central1 --format='value(status.url)'

# Redeploy latest image
gcloud run deploy ufc-elo-web --image us-central1-docker.pkg.dev/ufc-elo-lab/ufc-elo/ufc-elo-web:latest --region us-central1
```

## Terraform Alternative

Instead of manual commands, you can use the Terraform configs in `infra/terraform/`:

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
```
