export default function FighterLoading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="h-9 w-64 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-8 w-32 animate-pulse rounded-full bg-[var(--surface-muted)]" />
          <div className="h-4 w-24 animate-pulse rounded bg-[var(--surface-muted)]" />
        </div>
      </div>

      {/* Rating Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-[var(--outline)] bg-[var(--surface-muted)]"
          />
        ))}
      </div>

      {/* Stats Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <section
            key={i}
            className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-sm"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-[var(--surface-muted)]" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((j) => (
                <div
                  key={j}
                  className="h-20 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Recent Fights Table */}
      <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-sm">
        <div className="border-b border-[var(--outline)] px-6 py-4">
          <div className="h-5 w-40 animate-pulse rounded bg-[var(--surface-muted)]" />
          <div className="mt-1 h-3 w-64 animate-pulse rounded bg-[var(--surface-muted)]" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--outline)]">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i} className="border-t border-[var(--outline)]">
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-[var(--surface-muted)]" />
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
