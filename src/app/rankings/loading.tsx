export default function RankingsLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="h-9 w-80 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
        <div className="h-5 w-full max-w-3xl animate-pulse rounded bg-[var(--surface-muted)]" />
      </header>

      {/* Weight Class Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div
              key={i}
              className="h-8 w-24 animate-pulse rounded-full bg-[var(--surface-muted)]"
            />
          ))}
        </div>
      </div>

      {/* Sort and Limit Filters */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-24 animate-pulse rounded-full bg-[var(--surface-muted)]"
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-12 animate-pulse rounded-full bg-[var(--surface-muted)]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Rankings Table */}
      <section className="overflow-hidden rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--outline)] px-6 py-4">
          <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-muted)]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)]">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 25 }).map((_, idx) => (
                <tr
                  key={idx}
                  className="border-t border-[var(--outline)] bg-[var(--surface)]"
                >
                  <td className="px-4 py-3">
                    <div className="h-4 w-8 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-40 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-8 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-3xl border border-[var(--outline)] bg-[var(--surface-muted)]"
          />
        ))}
      </div>
    </main>
  );
}
