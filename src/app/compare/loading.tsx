export default function CompareLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="h-9 w-56 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
        <div className="h-5 w-full max-w-3xl animate-pulse rounded bg-[var(--surface-muted)]" />
      </header>

      {/* Compare Section */}
      <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-sm">
        {/* Select Fields */}
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-20 animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-[var(--surface-muted)]" />
            </div>
          ))}
        </div>

        {/* Outcome Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)] p-5"
            >
              <div className="h-6 w-48 animate-pulse rounded bg-[var(--surface)]" />
              <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface)]" />
              <div className="mt-2 flex flex-col gap-1">
                <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface)]" />
                <div className="h-10 w-20 animate-pulse rounded bg-[var(--surface)]" />
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface)]" />
                <div className="h-8 w-24 animate-pulse rounded bg-[var(--surface)]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
