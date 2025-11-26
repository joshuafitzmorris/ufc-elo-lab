import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const highlights = [
  {
    title: "Performance-Weighted Elo",
    detail:
      "HOW you win matters. Dominant finishes, knockdowns, and strike differential multiply rating gains.",
  },
  {
    title: "Dual Rating Systems",
    detail: "Compare classic Elo (win/loss only) vs performance Elo (dominance rewarded) side-by-side.",
  },
  {
    title: "Rich Fight Analytics",
    detail: "Track knockdowns, strikes, takedowns, control time, and detailed position-based stats.",
  },
];

const modules = [
  {
    title: "Performance Dashboard",
    body: "System comparison, top gainers/losers, and statistical analysis of rating differences.",
  },
  {
    title: "Dual Rankings",
    body: "Filter by weight class, sort by classic/performance Elo, see who benefits from dominance.",
  },
  {
    title: "Fighter Analytics",
    body: "Detailed performance metrics, finish rates, strike accuracy, and dominant win tracking.",
  },
  {
    title: "Head-to-head",
    body: "Compare two fighters with both rating systems and see expected scores.",
  },
];

const pipeline = [
  { label: "Ingest JSON/CSV", detail: "POST to /api/ingest or seed locally." },
  { label: "Validate + dedupe", detail: "Zod schema + unique fight key by date/event." },
  {
    label: "Recompute Elo",
    detail: "Replay fights chronologically with base rating 1500, K 24->12, upset bonus.",
  },
  { label: "Visualize", detail: "Leaderboards, timelines, compare, and simulator UI." },
];

const roadmap = [
  "Volatility-aware Elo with decay and opponent strength weighting",
  "Seeded matchup simulator with venue/weight toggles",
  "Charts for momentum, streaks, and per-division leaderboards",
];

type Summary = {
  fighters: number;
  fights: number;
  snapshots: number;
  calcRun: { id: string; description: string | null; createdAt: Date } | null;
};

async function getSummary(): Promise<Summary> {
  try {
    const [fighters, fights, snapshots, calcRun] = await Promise.all([
      prisma.fighter.count(),
      prisma.fight.count(),
      prisma.ratingSnapshot.count(),
      prisma.calcRun.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, description: true, createdAt: true },
      }),
    ]);

    return {
      fighters,
      fights,
      snapshots,
      calcRun,
    };
  } catch (error) {
    console.error("Failed to load summary for homepage", error);
    return { fighters: 0, fights: 0, snapshots: 0, calcRun: null };
  }
}

export default async function Home() {
  const summary = await getSummary();

  return (
    <div className="min-h-screen">
      <header className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(31,111,255,0.10),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(11,76,201,0.16),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="flex flex-col gap-6">
              <span className="inline-flex w-fit items-center rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)] ring-1 ring-[var(--outline)]">
                Sport science / Live Elo
              </span>
              <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
                Tuned Elo for every UFC numbered event, ready for dashboards.
              </h1>
              <p className="max-w-2xl text-pretty text-lg text-[var(--muted)]">
                Seeded with UFC 1-322 fights, replayable calculation runs, and a
                modern interface for recruiters to explore. Built with Next.js 16,
                Tailwind v4, Prisma, and Postgres.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatTile
                  label="Fights ingested"
                  value={summary.fights}
                  hint="Updated via seed or /api/ingest"
                />
                <StatTile
                  label="Fighters tracked"
                  value={summary.fighters}
                  hint="Names deduped on ingest"
                />
                <StatTile
                  label="Snapshots stored"
                  value={summary.snapshots}
                  hint="Per-fight rating history"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:translate-y-[-1px] hover:bg-[var(--accent-strong)]"
                  href="/dashboard"
                >
                  View analytics dashboard
                </a>
                <a
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:translate-y-[-1px] hover:bg-[var(--accent-strong)]"
                  href="/rankings"
                >
                  Explore rankings
                </a>
                <a
                  className="rounded-full border border-[var(--outline)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:translate-y-[-1px] hover:border-[var(--accent)]"
                  href="#pipeline"
                >
                  See the ingest flow
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-[var(--outline)] bg-[var(--surface)]/80 px-6 py-5 shadow-lg backdrop-blur">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(31,111,255,0.22),transparent_36%)]" />
              <div className="relative flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Model snapshot
                  </div>
                  <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
                    Elo v1
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <DialCard label="Starting rating" value="1500" badge="global" />
                  <DialCard label="K-factor" value="24 -> 12" badge="recency" />
                  <DialCard label="Upset bonus" value="+12%" badge="underdog" />
                  <DialCard label="Draw delta" value="Customizable" badge="ties" />
                </div>
                <div className="rounded-2xl border border-[var(--outline)] bg-[var(--surface)]/80 px-4 py-4 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Latest calc run
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1">
                      {summary.calcRun?.description ?? "Not run yet"}
                    </span>
                    <span className="text-[var(--foreground)]">
                      {summary.calcRun
                        ? formatDate(summary.calcRun.createdAt)
                        : "-"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Fights" value={summary.fights} />
                    <MiniStat label="Fighters" value={summary.fighters} />
                    <MiniStat label="Snapshots" value={summary.snapshots} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <FeatureCard key={item.title} title={item.title} detail={item.detail} />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-14">
        <section
          id="dashboard"
          className="grid gap-6 rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-8 shadow-sm md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Dashboard stack
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              Leaderboards, timelines, compare, and simulator
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              The UI stays intentionally minimal: crisp mono numerics, subtle gradients,
              and deliberate spacing to keep the focus on the ratings.
            </p>
          </div>
          <div className="md:col-span-3">
            <div className="grid gap-4 sm:grid-cols-2">
              {modules.map((item) => (
                <ModuleCard key={item.title} title={item.title} body={item.body} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="pipeline"
          className="grid gap-6 rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-8 shadow-sm md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Data flow
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              Ingest, validate, recompute, visualize
            </h2>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Post JSON to `/api/ingest` or run `prisma db seed` to replay the full
              dataset. Fighters are deduped, fights are upserted by a unique key, and a
              fresh calc run is stored for charts.
            </p>
          </div>
          <div className="md:col-span-3 grid gap-3 sm:grid-cols-2">
            {pipeline.map((step, idx) => (
              <PipelineStep key={step.label} index={idx + 1} {...step} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Data format
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            Simple ingest payload, snapshots generated automatically
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)] p-5 font-[var(--font-mono)] text-sm text-[var(--foreground)]">
              <p className="text-[var(--muted)]">Fight row shape (JSON/CSV)</p>
              <pre className="mt-2 overflow-x-auto text-xs leading-6">
{`{ 
  date: "2023-05-06",
  fighterA: "Fighter A",
  fighterB: "Fighter B",
  winner: "fighterA" | "fighterB" | "draw" | "no-contest",
  method: "ko" | "tko" | "submission" | "decision",
  weightClass: "lightweight",
  rounds: 3,
  event: "UFC 288"
}`}
              </pre>
            </div>
            <div className="grid gap-3">
              <FeatureCard
                title="Zod validation"
                detail="Fight payloads are validated server-side; bad rows return a 400 with field errors."
              />
              <FeatureCard
                title="Unique fight key"
                detail="date + fighters + event + weight class guard against duplicates across ingests."
              />
              <FeatureCard
                title="Replayable runs"
                detail="Every ingest captures a new calc run with snapshots for both fighters after each bout."
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            Roadmap
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            What ships next
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {roadmap.map((item, idx) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)]"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--outline)] bg-[var(--surface)] px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-[var(--font-mono)] text-[var(--foreground)]">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      {hint ? <p className="text-[11px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-muted)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="text-base font-[var(--font-mono)] text-[var(--foreground)]">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
    </div>
  );
}

function DialCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)] px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {badge}
        </span>
      </div>
      <p className="text-lg font-[var(--font-mono)] text-[var(--accent-strong)]">
        {value}
      </p>
    </div>
  );
}

function FeatureCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--outline)] bg-[var(--surface)] px-4 py-5 shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-[var(--accent)]" />
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function ModuleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)] px-4 py-3 shadow-sm">
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{body}</p>
    </div>
  );
}

function PipelineStep({
  index,
  label,
  detail,
}: {
  index: number;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)] p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-semibold text-[var(--accent-strong)]">
          {String(index).padStart(2, "0")}
        </span>
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
      </div>
      <p className="text-sm text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
