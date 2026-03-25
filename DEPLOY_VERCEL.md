# UFC ELO — Vercel Quick Deploy

**Time to deploy: ~10 minutes**
**Cost: $0 (Hobby) or $20/mo (Pro)**

Fastest path to production. No Terraform, no Docker, no GCP project needed.

---

## Prerequisites

- Vercel account (vercel.com)
- GitHub repo access
- Node 20+

---

## Step 1: Database (3 min)

Pick one — all work with Prisma:

### Option A: Neon (Recommended — free tier, serverless)
1. Go to https://neon.tech → Create project
2. Copy the pooled connection string
3. That's your `DATABASE_URL`

### Option B: Vercel Postgres
1. Deploy first (Step 2), then go to Storage → Create Database → Postgres
2. Auto-links `DATABASE_URL` to your project

### Option C: Railway ($5/mo)
1. https://railway.app → New Project → PostgreSQL
2. Copy `Postgres Connection URL`

---

## Step 2: Deploy (3 min)

### Via Dashboard (easiest)
1. Go to https://vercel.com/new
2. Import `joshuafitzmorris/ufc_elo` repo
3. Add environment variable: `DATABASE_URL` = your connection string
4. Click Deploy

### Via CLI
```bash
npx vercel login
npx vercel link
npx vercel env add DATABASE_URL  # paste connection string
npx vercel --prod
```

> **Note:** `postinstall` hook automatically runs `prisma generate` during Vercel's build.

---

## Step 3: Seed Database (3 min)

After first deploy, push schema and seed data:

```bash
# Set the production DATABASE_URL locally
export DATABASE_URL="postgres://..."

# Push Prisma schema to production DB
npx prisma db push

# Seed with fights.json (8618 fights, ~34MB)
npm run db:seed
```

Seeding takes ~1-2 minutes for all historical fight data.

---

## Step 4: Verify

- [ ] Site loads at `*.vercel.app` URL
- [ ] `/rankings` shows Elo rankings
- [ ] `/dashboard` renders charts
- [ ] `/fighters/[id]` shows individual fighter stats
- [ ] `/compare` works for head-to-head
- [ ] `/api/health` returns 200

---

## Custom Domain

1. Vercel project → Settings → Domains
2. Add domain (e.g., `ufcelo.com`)
3. Update DNS (CNAME to `cname.vercel-dns.com`)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |

That's it. No other secrets needed.

---

## Post-Deploy Checklist

- [ ] Database seeded with all fights
- [ ] SEO meta tags rendering (check with https://cards-dev.twitter.com/validator)
- [ ] OG images working (test with Facebook debugger)
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] PWA manifest at `/manifest.webmanifest`
- [ ] Set up Vercel Analytics (free on Hobby)

---

## Compared to GCP

| | Vercel | GCP |
|---|--------|-----|
| Time | 10 min | 1-2 hours |
| Cost | $0 | $10-15/mo minimum |
| Complexity | Click deploy | Terraform + Docker + service accounts |
| DB | Neon free tier | Cloud SQL ($7/mo+) |
| CI/CD | Automatic on push | GitHub Actions config |
| Custom domain | Free | Load balancer + SSL cert |

**Use Vercel. Migrate to GCP later only if you need to.**
