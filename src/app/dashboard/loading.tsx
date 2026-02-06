export default function DashboardLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="h-4 w-40 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="h-9 w-96 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
        <div className="h-5 w-full max-w-3xl animate-pulse rounded bg-[var(--surface-muted)]" />
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)]"
          />
        ))}
      </div>

      {/* Gainers and Losers Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((section) => (
          <section
            key={section}
            className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm"
          >
            <div className="border-b border-[var(--outline)] px-6 py-4">
              <div className="h-5 w-48 animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="mt-1 h-3 w-64 animate-pulse rounded bg-[var(--surface-muted)]" />
            </div>
            <div className="divide-y divide-[var(--outline)]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                    <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
                    <div className="h-10 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
                    <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Top 10 Table */}
      <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--outline)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-5 w-48 animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="mt-1 h-3 w-64 animate-pulse rounded bg-[var(--surface-muted)]" />
            </div>
            <div className="h-10 w-40 animate-pulse rounded-full bg-[var(--surface-muted)]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--outline)]">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <tr key={i} className="border-t border-[var(--outline)]">
                  <td className="px-6 py-3">
                    <div className="h-4 w-8 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Insight Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)]"
          />
        ))}
      </div>
    </main>
  );
}
