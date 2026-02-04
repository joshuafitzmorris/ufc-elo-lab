# UFC ELO Deployment Checklist

**Target:** GCP Cloud Run + Cloud SQL  
**Estimated cost:** ~$10-15/month (db-f1-micro tier)  
**Launch target:** UFC 326 (March 7, 2026)

## Prerequisites

- [ ] GCP Project with billing enabled
- [ ] `gcloud` CLI authenticated
- [ ] Terraform >= 1.5.0 installed
- [ ] Docker installed

## Step 1: Create terraform.tfvars

```bash
cd projects/ufc_elo/infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit with your values:
```hcl
project_id  = "your-gcp-project-id"
region      = "us-central1"
db_tier     = "db-f1-micro"
db_password = "generate-a-secure-password"
```

## Step 2: Apply Terraform Infrastructure

```bash
cd projects/ufc_elo/infra/terraform
terraform init
terraform plan    # Review changes
terraform apply   # Creates Cloud SQL, Artifact Registry, Cloud Run
```

Save the outputs:
- `app_url` - Your Cloud Run URL
- `database_connection` - The DATABASE_URL for secrets

## Step 3: Create Secret Manager Secret

```bash
# Get the database URL from Terraform
DATABASE_URL=$(terraform output -raw database_connection)

# Create the secret
gcloud secrets create DATABASE_URL --replication-policy="automatic"
echo -n "$DATABASE_URL" | gcloud secrets versions add DATABASE_URL --data-file=-

# Grant Cloud Run access (service account created by Terraform)
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Step 4: Set Up GitHub Secrets

Go to: https://github.com/joshuafitzmorris/ufc-elo-lab/settings/secrets/actions

Create environment: `Production`

Add secrets:
- `GCP_PROJECT_ID` - Your GCP project ID
- `GCP_SA_KEY` - Service account JSON key (see below)

### Create Service Account Key

```bash
# Create service account (if not exists)
gcloud iam service-accounts create ufc-elo-deployer \
  --display-name="UFC ELO Deployer"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:ufc-elo-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:ufc-elo-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:ufc-elo-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Generate key
gcloud iam service-accounts keys create ./deployer-key.json \
  --iam-account=ufc-elo-deployer@$PROJECT_ID.iam.gserviceaccount.com

# Copy contents of deployer-key.json to GitHub secret GCP_SA_KEY
cat deployer-key.json

# Then delete local key file!
rm deployer-key.json
```

## Step 5: Run Initial Deployment

Either:
- Push to `main` branch, or
- Manually trigger workflow at https://github.com/joshuafitzmorris/ufc-elo-lab/actions

## Step 6: Run Database Migration & Seed

Connect to production database and run:

```bash
# Set DATABASE_URL to production value
export DATABASE_URL="postgresql://ufc_elo:password@ip:5432/ufc_elo"

# Push schema
npx prisma migrate deploy

# Seed from fights.json
npx prisma db seed
```

Alternative: Use Cloud Shell or a one-off Cloud Run job.

## Step 7: Verify

- [ ] App loads at Cloud Run URL
- [ ] Fighter list displays
- [ ] Elo rankings show
- [ ] Charts render

## Optional: Custom Domain

```bash
gcloud run domain-mappings create \
  --service=ufc-elo \
  --domain=elo.yourdomain.com \
  --region=us-central1
```

Then configure DNS CNAME per gcloud output.

---

## Quick Commands

```bash
# View logs
gcloud run services logs read ufc-elo --region=us-central1

# Force new deployment
gcloud run services update ufc-elo --image $REGION-docker.pkg.dev/$PROJECT_ID/ufc-elo/app:latest --region=us-central1

# Connect to DB
psql $(terraform output -raw database_connection)
```
