# UFC ELO — Vercel Quick Deploy

**Time to deploy: ~15 minutes**  
**Cost: $0 (hobby tier) or $20/mo (Pro)**

This is the fastest path to production. Use this instead of the GCP setup if time is tight.

---

## Step 1: Database (5 min)

### Option A: Vercel Postgres (Recommended)
1. Go to https://vercel.com/dashboard
2. Create a new project → Import the `ufc-elo-lab` repo
3. Go to Storage → Create Database → Postgres
4. Copy the `DATABASE_URL` from connection details

### Option B: Railway
1. Go to https://railway.app
2. New Project → Provision PostgreSQL
3. Copy the connection string (use `Postgres Connection URL`)

### Option C: Neon (Free Tier)
1. Go to https://neon.tech
2. Create project → Copy connection string

---

## Step 2: Deploy to Vercel (5 min)

```bash
# From project root
npm i -g vercel
vercel login
vercel link  # Link to existing project or create new
vercel env add DATABASE_URL  # Paste your DB URL
vercel --prod
```

Or via dashboard:
1. Import repo: https://vercel.com/new
2. Add environment variable: `DATABASE_URL`
3. Deploy

---

## Step 3: Database Setup (5 min)

After deploy, run migrations:

```bash
# Set DATABASE_URL locally to production value
export DATABASE_URL="postgres://..."

# Push schema
npx prisma migrate deploy

# Seed data
npx prisma db seed
```

Or use Vercel CLI:
```bash
vercel env pull .env.production.local
source .env.production.local
npx prisma migrate deploy && npx prisma db seed
```

---

## Step 4: Verify

- [ ] Site loads at vercel URL
- [ ] Fighter list shows
- [ ] Rankings display
- [ ] Charts render

---

## Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your domain
3. Update DNS per Vercel instructions

---

## Compared to GCP Setup

| | Vercel | GCP |
|---|--------|-----|
| Time | 15 min | 1-2 hours |
| Cost | $0-20/mo | $10-15/mo |
| Complexity | Click deploy | Terraform, secrets, service accounts |
| DB | Vercel Postgres included | Cloud SQL setup required |
| CI/CD | Automatic | GitHub Actions config |

**For a quick launch, use Vercel. Migrate to GCP later if needed.**
