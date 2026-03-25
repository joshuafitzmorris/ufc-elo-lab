import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(31,111,255,0.2),transparent_60%)]" />
          <h1 className="relative text-9xl font-[var(--font-mono)] font-bold text-[var(--accent)]">
            404
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">
            Fighter not found
          </h2>
          <p className="text-lg text-[var(--muted)]">
            This page hasn&apos;t entered the octagon yet. Perhaps it&apos;s still in training camp?
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
          >
            Return home
          </Link>
          <Link
            href="/rankings"
            className="rounded-full border border-[var(--outline)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            View rankings
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-[var(--outline)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            Dashboard
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--outline)] bg-[var(--surface)] px-6 py-4 text-sm text-[var(--muted)]">
          <p>
            Lost in the rankings? Try navigating to one of the pages above or check the URL for typos.
          </p>
        </div>
      </div>
    </main>
  );
}
