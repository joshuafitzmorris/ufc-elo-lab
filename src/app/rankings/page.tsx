import Link from "next/link";
import { getDualRankings, getWeightClasses } from "@/lib/analytics";

type Props = {
  searchParams: Promise<{ weightClass?: string; sort?: string; limit?: string }>;
};

export default async function RankingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const weightClass = params.weightClass;
  const sortBy = (params.sort as "classic" | "performance" | "peak" | "diff") || "performance";
  const limit = parseInt(params.limit || "50", 10);

  const [rankings, weightClasses] = await Promise.all([
    getDualRankings(weightClass, sortBy, limit),
    getWeightClasses(),
  ]);

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Rankings
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          Dual Elo System Comparison
        </h1>
        <p className="max-w-3xl text-sm text-[var(--muted)]">
          Compare classic Elo (win/loss only) vs performance-weighted Elo (HOW you
          win matters). Positive differences reward dominant finishers.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Weight class:
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/rankings"
              className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                !weightClass
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              All
            </Link>
            {weightClasses.map((wc) => (
              <Link
                key={wc}
                href={`/rankings?weightClass=${encodeURIComponent(wc)}`}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  weightClass === wc
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {wc}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Sort by:
          </span>
          <div className="flex gap-2">
            {[
              { value: "performance", label: "Current" },
              { value: "peak", label: "Peak Rating" },
              { value: "classic", label: "Classic Elo" },
              { value: "diff", label: "Difference" },
            ].map((option) => (
              <Link
                key={option.value}
                href={`/rankings?${new URLSearchParams({ ...(weightClass && { weightClass }), sort: option.value, limit: limit.toString() })}`}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  sortBy === option.value
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Show:
          </span>
          <div className="flex gap-2">
            {[25, 50, 100, 200].map((n) => (
              <Link
                key={n}
                href={`/rankings?${new URLSearchParams({ ...(weightClass && { weightClass }), sort: sortBy, limit: n.toString() })}`}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  limit === n
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {n}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--outline)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            {weightClass ? `${weightClass} Rankings` : "All Fighters"}
          </h2>
          <span className="text-xs font-medium text-[var(--muted)]">
            Top {rankings.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                <th className="px-4 py-3 text-xs font-medium">Rank</th>
                <th className="px-4 py-3 text-xs font-medium">Fighter</th>
                <th className="px-4 py-3 text-xs font-medium">Weight</th>
                <th className="px-4 py-3 text-xs font-medium text-right">
                  Current
                </th>
                <th className="px-4 py-3 text-xs font-medium text-right">
                  Peak
                </th>
                <th className="px-4 py-3 text-xs font-medium text-right">
                  From Peak
                </th>
                <th className="px-4 py-3 text-xs font-medium text-right">
                  Fights
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, idx) => {
                const dropColor =
                  row.dropFromPeak > 50
                    ? "text-red-600"
                    : row.dropFromPeak > 20
                      ? "text-orange-500"
                      : row.dropFromPeak === 0
                        ? "text-green-600"
                        : "text-[var(--muted)]";

                return (
                  <tr
                    key={row.fighterId}
                    className="border-t border-[var(--outline)] bg-[var(--surface)] transition hover:bg-[var(--surface-muted)]"
                  >
                    <td className="px-4 py-3 align-middle font-[var(--font-mono)] text-[var(--muted)]">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Link
                        href={`/fighters/${row.fighterId}`}
                        className="font-semibold text-[var(--foreground)] underline decoration-[var(--outline)] underline-offset-4 hover:decoration-[var(--accent)]"
                      >
                        {row.name}
                      </Link>
                      {row.nickname && (
                        <span className="ml-2 text-xs text-[var(--muted)]">
                          &ldquo;{row.nickname}&rdquo;
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-[var(--muted)]">
                      {row.weightClass}
                    </td>
                    <td className="px-4 py-3 align-middle text-right font-[var(--font-mono)] font-semibold text-[var(--accent-strong)]">
                      {Math.round(row.performanceRating ?? row.classicRating)}
                    </td>
                    <td className="px-4 py-3 align-middle text-right font-[var(--font-mono)] text-[var(--foreground)]">
                      {Math.round(row.peakPerformanceRating ?? row.performanceRating ?? row.classicRating)}
                    </td>
                    <td
                      className={`px-4 py-3 align-middle text-right font-[var(--font-mono)] ${dropColor}`}
                    >
                      {row.dropFromPeak > 0 ? `-${Math.round(row.dropFromPeak)}` : "0"}
                    </td>
                    <td className="px-4 py-3 align-middle text-right font-[var(--font-mono)] text-[var(--muted)]">
                      {row.fightCount}
                    </td>
                  </tr>
                );
              })}

              {rankings.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-6 text-center text-sm text-[var(--muted)]"
                  >
                    No ranking data available. Ensure the database is seeded with
                    performance Elo enabled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Understanding the Systems
          </h3>
          <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <div>
              <span className="font-semibold text-[var(--foreground)]">
                Classic Elo:
              </span>{" "}
              Traditional system based purely on wins, losses, and opponent strength.
              A win is a win regardless of how it happens.
            </div>
            <div>
              <span className="font-semibold text-[var(--accent-strong)]">
                Performance Elo:
              </span>{" "}
              Rewards HOW you win. Knockouts, submissions, dominance in stats
              (knockdowns, strike differential, control time) increase rating gains.
              Split decisions are worth less than dominant finishes.
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            Performance Multipliers
          </h3>
          <div className="mt-4 grid gap-2 text-sm">
            {[
              { label: "Finish Quality", range: "0.8 - 1.4x" },
              { label: "Domination Score", range: "0.85 - 1.3x" },
              { label: "Round Efficiency", range: "0.95 - 1.2x" },
              { label: "Activity Penalty", range: "0.9 - 1.0x" },
              { label: "Weight Class Adj", range: "0.95 - 1.05x" },
              { label: "Title Bonus", range: "1.0 - 1.08x" },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between rounded-xl bg-[var(--surface-muted)] px-3 py-2"
              >
                <span className="text-[var(--foreground)]">{m.label}</span>
                <span className="font-[var(--font-mono)] text-[var(--muted)]">
                  {m.range}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
