import Link from "next/link";
import { getLeaderboardRows } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboardRows();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          Leaderboard
        </h1>
        <p className="max-w-3xl text-sm text-[var(--muted)]">
          Latest Elo standings from the most recent calculation run. Click a
          fighter to view their timeline.
        </p>
      </header>

      <section className="overflow-hidden rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--outline)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            Top fighters
          </h2>
          <span className="text-xs font-medium text-[var(--muted)]">
            {leaderboard.length} ranked
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                {["Rank", "Fighter", "Weight", "Rating", "Last fight"].map(
                  (header) => (
                    <th key={header} className="px-6 py-3 text-xs font-medium">
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, idx) => (
                <tr
                  key={row.fighterId}
                  className="border-t border-[var(--outline)] bg-[var(--surface)] transition hover:bg-[var(--surface-muted)]"
                >
                  <td className="px-6 py-3 align-middle text-[var(--muted)]">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <Link
                      href={`/fighters/${row.fighterId}`}
                      className="font-semibold text-[var(--foreground)] underline decoration-[var(--outline)] underline-offset-4 hover:decoration-[var(--accent)]"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 align-middle text-[var(--muted)]">
                    {row.weightClass}
                  </td>
                  <td className="px-6 py-3 align-middle font-semibold text-[var(--foreground)]">
                    {Math.round(row.rating)}
                  </td>
                  <td className="px-6 py-3 align-middle text-[var(--muted)]">
                    {formatDate(row.lastFight)}
                  </td>
                </tr>
              ))}

              {leaderboard.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-6 text-center text-sm text-[var(--muted)]"
                  >
                    No leaderboard data yet. Seed the database and refresh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
