import Link from "next/link";

export default function FighterNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2),transparent_60%)]" />
          <div className="relative flex items-center justify-center">
            <span className="text-7xl">🥊</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">
            This fighter hasn&apos;t entered the octagon yet
          </h2>
          <p className="text-lg text-[var(--muted)]">
            We couldn&apos;t find a fighter with that ID. They might be training for their debut, or the link might be incorrect.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/rankings"
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
          >
            Browse all fighters
          </Link>
          <Link
            href="/leaderboard"
            className="rounded-full border border-[var(--outline)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            View leaderboard
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[var(--outline)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            Home
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--outline)] bg-[var(--surface)] px-6 py-4 text-sm text-[var(--muted)]">
          <p>
            <strong className="text-[var(--foreground)]">Tip:</strong> You can find valid fighter profiles by browsing the rankings or searching the leaderboard.
          </p>
        </div>
      </div>
    </main>
  );
}
