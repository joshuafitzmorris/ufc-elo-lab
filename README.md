# UFC Elo Rating System

A dual Elo rating system for UFC fighters that compares traditional win/loss Elo with a performance-weighted variant that rewards *how* you win. Built with Next.js 16, TypeScript, Tailwind v4, Prisma, and PostgreSQL.

## Features

- **Dual Elo System**: Compare classic Elo (win/loss only) vs performance-weighted Elo
- **Performance Multipliers**: Rewards knockouts, submissions, dominant finishes, and statistical dominance
- **Peak Rating Tracking**: See each fighter's all-time peak rating alongside their current rating
- **Rankings Dashboard**: Filter by weight class, sort by current/peak/classic rating
- **Fighter Profiles**: Detailed stats, rating history, and fight-by-fight breakdown
- **Fight Statistics**: Knockdowns, significant strikes, takedowns, control time integration

## Performance Elo Multipliers

The performance system applies these factors to rating changes:

| Factor | Range | Description |
|--------|-------|-------------|
| Finish Quality | 0.8 - 1.4x | KO > TKO > SUB > UD > SD |
| Domination Score | 0.85 - 1.3x | Strike diff, knockdowns, control time |
| Round Efficiency | 0.95 - 1.2x | Early finishes rewarded |
| Activity Penalty | 0.9 - 1.0x | Penalizes low-output decisions |
| Weight Class Adj | 0.95 - 1.05x | Accounts for natural pace differences |
| Title Bonus | 1.0 - 1.08x | Championship fight multiplier |

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL + Prisma ORM
- **Charts**: Recharts
- **Validation**: Zod

## Quick Start

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment and start database:
```bash
cp .env.example .env
docker compose up -d
```

3. Run migrations and seed:
```bash
npx prisma migrate deploy
npx prisma db seed
```

The seed command looks for local fight data files (`fights*.json`) and loads them automatically.

4. Start the development server:
```bash
npm run dev
```

Visit http://localhost:3000

## Data Ingestion

### API Endpoint

POST to `/api/ingest` with fight data:

```json
{
  "description": "UFC 280",
  "fights": [{
    "date": "2022-10-22",
    "fighterA": "Islam Makhachev",
    "fighterB": "Charles Oliveira",
    "winner": "fighterA",
    "method": "SUBMISSION",
    "weightClass": "Lightweight",
    "rounds": 5,
    "event": "UFC 280",
    "stats": {
      "fighterA": {
        "knockdowns": 0,
        "sigStrikesLanded": 35,
        "sigStrikesAttempted": 56,
        "takedownsLanded": 4,
        "takedownsAttempted": 6,
        "controlTimeSeconds": 420
      },
      "fighterB": {
        "knockdowns": 0,
        "sigStrikesLanded": 28,
        "sigStrikesAttempted": 67,
        "takedownsLanded": 0,
        "takedownsAttempted": 1,
        "controlTimeSeconds": 0
      }
    }
  }]
}
```

### Scraping Tools

**TypeScript scraper (UFCStats):**
```bash
npx tsx scripts/scrapeUfcEvents.ts --limit 50 --output fights.json
```

**Python scraper (ufc_api):**
```bash
pip install ufc_api
python scripts/export_from_ufc_api.py --event "UFC 280" --output fights.json
```

## Project Structure

```
src/
  app/              # Next.js App Router pages
    api/            # API routes (health, ingest, leaderboard)
    rankings/       # Rankings page
    fighters/[id]/  # Fighter profile pages
    dashboard/      # System comparison dashboard
  components/       # React components
  lib/
    elo/            # Elo engine and performance multipliers
    analytics.ts    # Rankings and analytics queries
    prisma.ts       # Prisma client
prisma/
  schema.prisma     # Database schema
  seed.ts           # Database seeder
infra/              # Terraform AWS infrastructure
scripts/            # Data scraping and utility scripts
```

## Deployment

### Docker

Build the container:
```bash
docker build -t ufc-elo .
```

Run locally:
```bash
docker run -p 3000:3000 -e DATABASE_URL="postgresql://..." ufc-elo
```

### AWS (Terraform)

The `infra/` directory contains Terraform modules for:
- VPC with public/private subnets
- RDS PostgreSQL (encrypted, private subnet)
- ECS Fargate cluster and service
- Application Load Balancer
- Secrets Manager for credentials
- CloudWatch logging

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your settings
terraform init
terraform plan
terraform apply
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with DB connectivity |
| `/api/ingest` | POST | Ingest fight data |
| `/api/leaderboard` | GET | Get fighter rankings |
| `/api/fighters/[id]` | GET | Get fighter details |

## License

MIT
