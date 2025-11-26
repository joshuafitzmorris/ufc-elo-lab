# AGENTS

- Project: UFC Elo dashboard — Next.js 16 (App Router, TypeScript), Tailwind v4, Postgres + Prisma, Recharts.
- Visual direction: “Sport science” — crisp blue/white palette, geometric accents, subtle gradients; Space Grotesk for headlines, JetBrains Mono for numbers.
- Data: Postgres only (see `docker-compose.yml` / `.env.example` for `DATABASE_URL`). Prisma as ORM; add seeds in `prisma/seed.ts`.
- Code organization: `src/app` for routes, `src/components` for UI, `src/lib/elo` for rating logic, `src/lib/data` for ingestion, `src/styles` for tokens if needed.
- Quality: TypeScript-first, Zod for input validation, loading/skeleton states on UI, tests with Vitest/RTL when added. Avoid reverting user changes; add concise comments only when code is non-obvious.
