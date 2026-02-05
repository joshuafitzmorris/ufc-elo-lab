export default function Loading() {
  return (
    <div className="min-h-screen">
      {/* Hero Section Skeleton */}
      <header className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(31,111,255,0.10),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(11,76,201,0.16),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:120px_120px]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 pt-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              <div className="h-6 w-40 animate-pulse rounded-full bg-[var(--surface-muted)]" />
              <div className="flex flex-col gap-3">
                <div className="h-12 w-full animate-pulse rounded-xl bg-[var(--surface-muted)]" />
                <div className="h-12 w-5/6 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-6 w-full animate-pulse rounded-lg bg-[var(--surface-muted)]" />
                <div className="h-6 w-4/5 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-36 animate-pulse rounded-full bg-[var(--surface-muted)]"
                  />
                ))}
              </div>
            </div>

            {/* Right Column - Model Snapshot Card */}
            <div className="relative overflow-hidden rounded-3xl border border-[var(--outline)] bg-[var(--surface)]/80 px-6 py-5 shadow-lg">
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-muted)]" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-20 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
                    />
                  ))}
                </div>
                <div className="h-40 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
              />
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-6 py-14">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-3xl bg-[var(--surface-muted)]"
          />
        ))}
      </main>
    </div>
  );
}
