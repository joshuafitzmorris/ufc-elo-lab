import { notFound } from "next/navigation";
import Link from "next/link";
import { getFighterPerformanceProfile } from "@/lib/analytics";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FighterPage({ params }: Props) {
  const { id } = await params;
  const profile = await getFighterPerformanceProfile(id);

  if (!profile) {
    notFound();
  }

  const { fighter, ratings, fightStats, performanceMetrics, recentFights } =
    profile;

  const winRate = (fightStats.wins / fightStats.total) * 100;
  const finishRate = (fightStats.finishes / fightStats.wins) * 100 || 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Fighter Profile
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          {fighter.name}
          {fighter.nickname && (
            <span className="ml-2 text-lg text-[var(--muted)]">
              &ldquo;{fighter.nickname}&rdquo;
            </span>
          )}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-sm font-semibold text-[var(--foreground)]">
            {fighter.weightClass}
          </span>
          <span className="text-sm text-[var(--muted)]">
            {fightStats.wins}-{fightStats.losses}-{fightStats.draws}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <RatingCard
          label="Classic Elo"
          value={Math.round(ratings.classic)}
          badge="Win/Loss"
          muted
        />
        <RatingCard
          label="Performance Elo"
          value={Math.round(ratings.performance)}
          badge="Dominance"
          highlight
        />
        <RatingCard
          label="Difference"
          value={ratings.diff > 0 ? `+${Math.round(ratings.diff)}` : Math.round(ratings.diff).toString()}
          badge={ratings.diff > 0 ? "Rewarded" : "Penalized"}
          gain={ratings.diff > 0}
          loss={ratings.diff < 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Fight Statistics
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricTile
              label="Total Fights"
              value={fightStats.total}
              detail={`${winRate.toFixed(1)}% win rate`}
            />
            <MetricTile
              label="Finishes"
              value={fightStats.finishes}
              detail={`${finishRate.toFixed(1)}% of wins`}
            />
            <MetricTile
              label="Decisions"
              value={fightStats.decisions}
              detail={`${fightStats.wins - fightStats.finishes} wins`}
            />
            <MetricTile
              label="Dominant Wins"
              value={performanceMetrics.dominantWins}
              detail="2+ KDs or 3+ min ctrl"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Performance Metrics
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricTile
              label="Avg Knockdowns"
              value={performanceMetrics.avgKnockdowns.toFixed(2)}
              detail="per fight"
            />
            <MetricTile
              label="Strike Accuracy"
              value={`${(performanceMetrics.avgSigStrikeAccuracy * 100).toFixed(1)}%`}
              detail="sig strikes landed"
            />
            <MetricTile
              label="TD Accuracy"
              value={`${(performanceMetrics.avgTakedownAccuracy * 100).toFixed(1)}%`}
              detail="takedowns landed"
            />
            <MetricTile
              label="Avg Control"
              value={`${Math.floor(performanceMetrics.avgControlTime / 60)}:${String(Math.floor(performanceMetrics.avgControlTime % 60)).padStart(2, "0")}`}
              detail="control time"
            />
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--outline)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Recent Fights
          </h2>
          <span className="text-xs font-medium text-[var(--muted)]">
            Last {recentFights.length} bouts
          </span>
        </div>
        <div className="divide-y divide-[var(--outline)]">
          {recentFights.map((fight) => {
            const resultColor =
              fight.result === "win"
                ? "text-green-600 bg-green-50"
                : fight.result === "loss"
                  ? "text-red-600 bg-red-50"
                  : "text-[var(--muted)] bg-[var(--surface-muted)]";

            return (
              <div key={fight.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold uppercase ${resultColor}`}
                      >
                        {fight.result}
                      </span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        vs{" "}
                        <Link
                          href={`/fighters/${fight.opponent.id}`}
                          className="underline decoration-[var(--outline)] underline-offset-4 hover:decoration-[var(--accent)]"
                        >
                          {fight.opponent.name}
                        </Link>
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
                      <span>{formatDate(fight.date)}</span>
                      <span>•</span>
                      <span>{fight.method}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {recentFights.length === 0 && (
            <div className="px-6 py-6 text-sm text-[var(--muted)]">
              No fight history available.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function RatingCard({
  label,
  value,
  badge,
  highlight,
  muted,
  gain,
  loss,
}: {
  label: string;
  value: number | string;
  badge: string;
  highlight?: boolean;
  muted?: boolean;
  gain?: boolean;
  loss?: boolean;
}) {
  const bgColor = highlight
    ? "bg-blue-50"
    : gain
      ? "bg-green-50"
      : loss
        ? "bg-red-50"
        : "bg-[var(--surface-muted)]";
  const valueColor = highlight
    ? "text-[var(--accent-strong)]"
    : gain
      ? "text-green-700"
      : loss
        ? "text-red-700"
        : muted
          ? "text-[var(--muted)]"
          : "text-[var(--foreground)]";

  return (
    <div
      className={`rounded-2xl border border-[var(--outline)] ${bgColor} px-5 py-4 shadow-sm`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          {label}
        </p>
        <span className="rounded-full bg-[var(--surface)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          {badge}
        </span>
      </div>
      <p className={`mt-2 text-3xl font-[var(--font-mono)] font-bold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-muted)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-xl font-[var(--font-mono)] font-semibold text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
