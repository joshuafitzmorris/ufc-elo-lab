#!/bin/bash
set -euo pipefail

# UFC ELO Deployment Script
# Run this after creating GCP project with billing enabled

# Configuration
PROJECT_ID="${PROJECT_ID:-ufc-elo-lab}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="ufc-elo"
IMAGE_TAG="${REGION}-docker.pkg.dev/${PROJECT_ID}/ufc-elo/app:latest"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Check prerequisites
command -v gcloud >/dev/null 2>&1 || error "gcloud CLI not installed"
command -v docker >/dev/null 2>&1 || error "Docker not installed"
command -v terraform >/dev/null 2>&1 || error "Terraform not installed"

# Verify logged in
log "Checking GCP authentication..."
gcloud auth print-identity-token >/dev/null 2>&1 || error "Not authenticated. Run: gcloud auth login"

# Set project
log "Setting GCP project to ${PROJECT_ID}..."
gcloud config set project "${PROJECT_ID}"

# Step 1: Infrastructure
log "Step 1/5: Provisioning infrastructure with Terraform..."
cd "$(dirname "$0")/../infra/terraform"

if [ ! -f terraform.tfvars ]; then
  cat > terraform.tfvars << EOF
project_id = "${PROJECT_ID}"
region     = "${REGION}"
EOF
  log "Created terraform.tfvars"
fi

terraform init -upgrade
terraform apply -auto-approve

# Get database URL
DATABASE_URL=$(terraform output -raw database_connection)
log "Database provisioned."

# Step 2: Build Docker image
log "Step 2/5: Building Docker image..."
cd "$(dirname "$0")/.."
docker build --platform linux/amd64 -t "${IMAGE_TAG}" .

# Step 3: Push to Artifact Registry
log "Step 3/5: Pushing to Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
docker push "${IMAGE_TAG}"

# Step 4: Deploy to Cloud Run
log "Step 4/5: Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_TAG}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=${DATABASE_URL},NODE_ENV=production" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10

# Get service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format='value(status.url)')
log "Deployed to: ${SERVICE_URL}"

# Step 5: Run migrations and seed
log "Step 5/5: Running database migrations and seed..."
warn "Running migrations locally - ensure you're connected to Cloud SQL..."
cd "$(dirname "$0")/.."

# For local migration, need to connect via Cloud SQL Proxy or allow IP
export DATABASE_URL
npx prisma migrate deploy
npx prisma db seed

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🥊 UFC ELO deployed successfully!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  URL: ${SERVICE_URL}"
echo -e "  Project: ${PROJECT_ID}"
echo -e "  Region: ${REGION}"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. Verify the site works at the URL above"
echo -e "  2. Set up custom domain (optional)"
echo -e "  3. Configure Google AdSense"
echo ""
