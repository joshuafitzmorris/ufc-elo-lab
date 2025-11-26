import Link from "next/link";
import { getSystemComparison, getDualRankings } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [comparison, topByPerformance] = await Promise.all([
    getSystemComparison(),
    getDualRankings(undefined, "performance"),
  ]);

  const top10 = topByPerformance.slice(0, 10);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Analytics Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          Performance Elo System Analysis
        </h1>
        <p className="max-w-3xl text-sm text-[var(--muted)]">
          Deep dive into how the performance-weighted Elo system rewards dominant
          victories and penalizes uninspiring wins compared to the classic system.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          label="Avg Difference"
          value={comparison.stats.avgDifference.toFixed(1)}
          unit="pts"
          badge="mean"
        />
        <StatCard
          label="Median Difference"
          value={comparison.stats.medianDifference.toFixed(1)}
          unit="pts"
          badge="median"
        />
        <StatCard
          label="Biggest Gain"
          value={`+${comparison.stats.maxGain.toFixed(0)}`}
          unit="pts"
          badge="max"
          highlight
        />
        <StatCard
          label="Biggest Loss"
          value={comparison.stats.maxLoss.toFixed(0)}
          unit="pts"
          badge="min"
          danger
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
          <div className="border-b border-[var(--outline)] px-6 py-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Biggest Gainers (Performance &gt; Classic)
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Fighters rewarded for dominant performances
            </p>
          </div>
          <div className="divide-y divide-[var(--outline)]">
            {comparison.topGainers.map((fighter, idx) => (
              <div key={fighter.fighterId} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                      {idx + 1}
                    </span>
                    <Link
                      href={`/fighters/${fighter.fighterId}`}
                      className="font-semibold text-[var(--foreground)] underline decoration-[var(--outline)] underline-offset-4 hover:decoration-[var(--accent)]"
                    >
                      {fighter.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="font-[var(--font-mono)] text-[var(--muted)]">
                        {Math.round(fighter.classic)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Classic
                      </div>
                    </div>
                    <div className="text-[var(--muted)]">→</div>
                    <div className="text-right">
                      <div className="font-[var(--font-mono)] font-semibold text-green-600">
                        {Math.round(fighter.performance)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Perf
                      </div>
                    </div>
                    <div className="min-w-[60px] text-right">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        +{Math.round(fighter.gain)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
          <div className="border-b border-[var(--outline)] px-6 py-4">
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Biggest Losers (Performance &lt; Classic)
            </h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Fighters penalized for uninspiring wins
            </p>
          </div>
          <div className="divide-y divide-[var(--outline)]">
            {comparison.topLosers.map((fighter, idx) => (
              <div key={fighter.fighterId} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                      {idx + 1}
                    </span>
                    <Link
                      href={`/fighters/${fighter.fighterId}`}
                      className="font-semibold text-[var(--foreground)] underline decoration-[var(--outline)] underline-offset-4 hover:decoration-[var(--accent)]"
                    >
                      {fighter.name}
                    </Link>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="font-[var(--font-mono)] text-[var(--muted)]">
                        {Math.round(fighter.classic)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Classic
                      </div>
                    </div>
                    <div className="text-[var(--muted)]">→</div>
                    <div className="text-right">
                      <div className="font-[var(--font-mono)] font-semibold text-red-600">
                        {Math.round(fighter.performance)}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        Perf
                      </div>
                    </div>
                    <div className="min-w-[60px] text-right">
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                        {Math.round(fighter.loss)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--outline)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Top 10 by Performance Elo
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Pound-for-pound rankings weighted by dominance
              </p>
            </div>
            <Link
              href="/rankings"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              View full rankings
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--outline)] text-left text-[var(--muted)]">
                <th className="px-6 py-3 text-xs font-medium">Rank</th>
                <th className="px-6 py-3 text-xs font-medium">Fighter</th>
                <th className="px-6 py-3 text-xs font-medium">Weight</th>
                <th className="px-6 py-3 text-xs font-medium text-right">
                  Classic
                </th>
                <th className="px-6 py-3 text-xs font-medium text-right">
                  Performance
                </th>
                <th className="px-6 py-3 text-xs font-medium text-right">Diff</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((fighter, idx) => {
                const diffColor =
                  fighter.ratingDiff > 20
                    ? "text-green-600"
                    : fighter.ratingDiff < -20
                      ? "text-red-600"
                      : "text-[var(--muted)]";

                return (
                  <tr
                    key={fighter.fighterId}
                    className="border-t border-[var(--outline)] transition hover:bg-[var(--surface-muted)]"
                  >
                    <td className="px-6 py-3 font-[var(--font-mono)] text-[var(--muted)]">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/fighters/${fighter.fighterId}`}
                        className="font-semibold text-[var(--foreground)] underline decoration-[var(--outline)] underline-offset-4 hover:decoration-[var(--accent)]"
                      >
                        {fighter.name}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-[var(--muted)]">
                      {fighter.weightClass}
                    </td>
                    <td className="px-6 py-3 text-right font-[var(--font-mono)] text-[var(--foreground)]">
                      {Math.round(fighter.classicRating)}
                    </td>
                    <td className="px-6 py-3 text-right font-[var(--font-mono)] font-semibold text-[var(--accent-strong)]">
                      {Math.round(fighter.performanceRating!)}
                    </td>
                    <td
                      className={`px-6 py-3 text-right font-[var(--font-mono)] ${diffColor}`}
                    >
                      {fighter.ratingDiff > 0 ? "+" : ""}
                      {Math.round(fighter.ratingDiff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <InsightCard
          title="System Philosophy"
          description="Performance Elo doesn't just ask WHO you beat, but HOW you beat them. A first-round KO over a top opponent is worth more than a split decision."
        />
        <InsightCard
          title="Multiplier Stack"
          description="Six independent multipliers combine: finish quality, domination score, round efficiency, activity penalty, weight class adjustment, and title bonus."
        />
        <InsightCard
          title="Statistical Dominance"
          description="Knockdowns, strike differential, takedown control, and control time are weighted to identify truly dominant performances beyond just the finish method."
        />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  unit,
  badge,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  unit: string;
  badge: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  const bgColor = highlight
    ? "bg-green-50"
    : danger
      ? "bg-red-50"
      : "bg-[var(--surface-muted)]";
  const valueColor = highlight
    ? "text-green-700"
    : danger
      ? "text-red-700"
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
      <div className="mt-2 flex items-baseline gap-1">
        <p className={`text-2xl font-[var(--font-mono)] font-bold ${valueColor}`}>
          {value}
        </p>
        <span className="text-sm text-[var(--muted)]">{unit}</span>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--outline)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="h-1 w-12 rounded-full bg-[var(--accent)]" />
      <h3 className="mt-4 text-sm font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}
