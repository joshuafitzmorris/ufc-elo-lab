"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.2),transparent_60%)]" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-[var(--outline)] bg-[var(--surface)]">
            <span className="text-5xl">⚠️</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">
            Something went wrong
          </h2>
          <p className="text-lg text-[var(--muted)]">
            The fight was stopped by the referee. An unexpected error occurred while loading this page.
          </p>
        </div>

        {error.digest && (
          <div className="rounded-xl border border-[var(--outline)] bg-[var(--surface-muted)] px-4 py-3 font-[var(--font-mono)] text-sm text-[var(--muted)]">
            Error ID: {error.digest}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-[var(--outline)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            Return home
          </Link>
        </div>

        <div className="mt-8 w-full rounded-2xl border border-[var(--outline)] bg-[var(--surface)] p-6 text-left">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            What happened?
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            An error occurred while rendering this page. This could be due to a temporary issue with the database, a malformed URL parameter, or an unexpected data state.
          </p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--accent)] hover:text-[var(--accent-strong)]">
              Technical details
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-3 text-xs text-[var(--foreground)]">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    </main>
  );
}
