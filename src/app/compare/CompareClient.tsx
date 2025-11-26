'use client';

import { useMemo, useState } from "react";

type LeaderboardRow = {
  fighterId: string;
  name: string;
  weightClass: string;
  rating: number;
};

type Props = {
  leaderboard: LeaderboardRow[];
};

export default function CompareClient({ leaderboard }: Props) {
  const [a, setA] = useState(leaderboard[0]?.fighterId ?? "");
  const [b, setB] = useState(leaderboard[1]?.fighterId ?? "");

  const aFighter = leaderboard.find((f) => f.fighterId === a);
  const bFighter = leaderboard.find((f) => f.fighterId === b);

  const expected = useMemo(() => {
    if (!aFighter || !bFighter) return { a: 0.5, b: 0.5 };
    const width = 400;
    const ea = 1 / (1 + 10 ** ((bFighter.rating - aFighter.rating) / width));
    return { a: ea, b: 1 - ea };
  }, [aFighter, bFighter]);

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Head-to-head
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          Compare fighters
        </h1>
        <p className="max-w-3xl text-sm text-[var(--muted)]">
          Pick two fighters to see expected score based on current Elo.
        </p>
      </header>

      <section className="rounded-3xl border border-[var(--outline)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <SelectField
            label="Fighter A"
            value={a}
            onChange={(value) => setA(value)}
            options={leaderboard}
          />
          <SelectField
            label="Fighter B"
            value={b}
            onChange={(value) => setB(value)}
            options={leaderboard.filter((f) => f.fighterId !== a)}
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <OutcomeCard
            name={aFighter?.name ?? "—"}
            weight={aFighter?.weightClass}
            rating={aFighter?.rating}
            expected={expected.a}
            accent
          />
          <OutcomeCard
            name={bFighter?.name ?? "—"}
            weight={bFighter?.weightClass}
            rating={bFighter?.rating}
            expected={expected.b}
          />
        </div>
      </section>
    </main>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: LeaderboardRow[];
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-[var(--foreground)]">
      {label}
      <select
        className="w-full rounded-xl border border-[var(--outline)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-2 ring-transparent transition focus:border-[var(--accent)] focus:ring-[rgba(31,111,255,0.16)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.fighterId} value={opt.fighterId}>
            {opt.name} • {opt.weightClass} • {Math.round(opt.rating)}
          </option>
        ))}
      </select>
    </label>
  );
}

function OutcomeCard({
  name,
  weight,
  rating,
  expected,
  accent = false,
}: {
  name: string;
  weight?: string;
  rating?: number;
  expected: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-5 shadow-sm ${
        accent
          ? "border-[var(--accent)] bg-[var(--surface-muted)]"
          : "border-[var(--outline)] bg-[var(--surface)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--foreground)]">{name}</p>
          <p className="text-xs text-[var(--muted)]">
            {weight ?? "—"} • Rating {rating ? Math.round(rating) : "—"}
          </p>
        </div>
        <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--foreground)]">
          {Math.round(expected * 100)}% expected
        </span>
      </div>
    </div>
  );
}
