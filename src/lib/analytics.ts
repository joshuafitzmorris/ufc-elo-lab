import { prisma } from "./prisma";

export type DualRankingRow = {
  fighterId: string;
  name: string;
  nickname: string | null;
  weightClass: string;
  classicRating: number;
  performanceRating: number | null;
  peakRating: number | null;
  peakPerformanceRating: number | null;
  ratingDiff: number;
  dropFromPeak: number;
  lastFight: Date;
  fightCount: number;
};

export type FighterPerformanceProfile = {
  fighter: {
    id: string;
    name: string;
    nickname: string | null;
    weightClass: string;
  };
  ratings: {
    classic: number;
    performance: number;
    diff: number;
  };
  fightStats: {
    total: number;
    wins: number;
    losses: number;
    draws: number;
    finishes: number;
    decisions: number;
  };
  performanceMetrics: {
    avgKnockdowns: number;
    avgSigStrikeAccuracy: number;
    avgTakedownAccuracy: number;
    avgControlTime: number;
    dominantWins: number;
  };
  recentFights: Array<{
    id: string;
    date: Date;
    opponent: { id: string; name: string };
    result: "win" | "loss" | "draw";
    method: string;
    classicChange: number;
    performanceChange: number;
  }>;
};

export type SystemComparison = {
  topGainers: Array<{
    fighterId: string;
    name: string;
    classic: number;
    performance: number;
    gain: number;
  }>;
  topLosers: Array<{
    fighterId: string;
    name: string;
    classic: number;
    performance: number;
    loss: number;
  }>;
  stats: {
    avgDifference: number;
    medianDifference: number;
    maxGain: number;
    maxLoss: number;
  };
};

export async function getDualRankings(
  weightClass?: string,
  sortBy: "classic" | "performance" | "peak" | "diff" = "performance",
  limit: number = 100
): Promise<DualRankingRow[]> {
  const calcRun = await prisma.calcRun.findFirst({
    where: { usePerformanceElo: true },
    orderBy: { createdAt: "desc" },
  });

  if (!calcRun) return [];

  // Use raw SQL for efficient grouping by fighter with latest fight date
  const query = `
    WITH latest_snapshots AS (
      SELECT DISTINCT ON (rs."fighterId")
        rs."fighterId",
        rs.rating,
        rs."performanceRating",
        rs."peakRating",
        rs."peakPerformanceRating",
        f.date as "lastFightDate",
        rs."createdAt"
      FROM "RatingSnapshot" rs
      INNER JOIN "Fight" f ON rs."fightId" = f.id
      WHERE rs."calcRunId" = $1
        AND rs."fightId" IS NOT NULL
        AND rs."performanceRating" IS NOT NULL
      ORDER BY rs."fighterId", f.date DESC
    ),
    fight_counts AS (
      SELECT
        "fighterId",
        COUNT(*) as count
      FROM (
        SELECT "fighterAId" as "fighterId" FROM "Fight"
        UNION ALL
        SELECT "fighterBId" as "fighterId" FROM "Fight"
      ) all_fights
      GROUP BY "fighterId"
    )
    SELECT
      f.id as "fighterId",
      f.name,
      f.nickname,
      f."weightClass",
      ls.rating as "classicRating",
      ls."performanceRating",
      ls."peakRating",
      ls."peakPerformanceRating",
      (ls."performanceRating" - ls.rating) as "ratingDiff",
      (COALESCE(ls."peakPerformanceRating", ls."performanceRating") - ls."performanceRating") as "dropFromPeak",
      ls."lastFightDate",
      COALESCE(fc.count, 0) as "fightCount"
    FROM "Fighter" f
    INNER JOIN latest_snapshots ls ON f.id = ls."fighterId"
    LEFT JOIN fight_counts fc ON f.id = fc."fighterId"
    ${weightClass ? `WHERE f."weightClass" = $2` : ''}
    ORDER BY
      CASE
        WHEN $${weightClass ? '3' : '2'} = 'classic' THEN ls.rating
        WHEN $${weightClass ? '3' : '2'} = 'performance' THEN ls."performanceRating"
        WHEN $${weightClass ? '3' : '2'} = 'peak' THEN COALESCE(ls."peakPerformanceRating", ls."performanceRating")
        ELSE (ls."performanceRating" - ls.rating)
      END DESC
    LIMIT $${weightClass ? '4' : '3'}
  `;

  const params = weightClass
    ? [calcRun.id, weightClass, sortBy, limit]
    : [calcRun.id, sortBy, limit];

  const rows = await prisma.$queryRawUnsafe<DualRankingRow[]>(query, ...params);

  return rows.map(row => ({
    ...row,
    performanceRating: row.performanceRating ?? row.classicRating,
    peakRating: row.peakRating ?? row.classicRating,
    peakPerformanceRating: row.peakPerformanceRating ?? row.performanceRating ?? row.classicRating,
    dropFromPeak: Number(row.dropFromPeak ?? 0),
    lastFight: new Date(row.lastFight),
    fightCount: Number(row.fightCount),
  }));
}

export async function getSystemComparison(): Promise<SystemComparison> {
  const calcRun = await prisma.calcRun.findFirst({
    where: { usePerformanceElo: true },
    orderBy: { createdAt: "desc" },
  });

  if (!calcRun) {
    return {
      topGainers: [],
      topLosers: [],
      stats: { avgDifference: 0, medianDifference: 0, maxGain: 0, maxLoss: 0 },
    };
  }

  // Efficient query to get latest snapshots for all fighters
  const query = `
    WITH latest_snapshots AS (
      SELECT DISTINCT ON (rs."fighterId")
        rs."fighterId",
        rs.rating,
        rs."performanceRating",
        f.date
      FROM "RatingSnapshot" rs
      INNER JOIN "Fight" f ON rs."fightId" = f.id
      WHERE rs."calcRunId" = $1
        AND rs."fightId" IS NOT NULL
        AND rs."performanceRating" IS NOT NULL
      ORDER BY rs."fighterId", f.date DESC
    )
    SELECT
      fi.id as "fighterId",
      fi.name,
      ls.rating as classic,
      ls."performanceRating" as performance,
      (ls."performanceRating" - ls.rating) as diff
    FROM "Fighter" fi
    INNER JOIN latest_snapshots ls ON fi.id = ls."fighterId"
  `;

  const diffs = await prisma.$queryRawUnsafe<Array<{
    fighterId: string;
    name: string;
    classic: number;
    performance: number;
    diff: number;
  }>>(query, calcRun.id);

  const topGainers = diffs
    .filter((d) => d.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 10)
    .map((d) => ({ ...d, gain: d.diff }));

  const topLosers = diffs
    .filter((d) => d.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 10)
    .map((d) => ({ ...d, loss: d.diff }));

  const allDiffs = diffs.map((d) => d.diff);
  const avgDifference =
    allDiffs.reduce((sum, d) => sum + d, 0) / allDiffs.length;
  const sorted = [...allDiffs].sort((a, b) => a - b);
  const medianDifference = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const maxGain = Math.max(...allDiffs);
  const maxLoss = Math.min(...allDiffs);

  return {
    topGainers,
    topLosers,
    stats: { avgDifference, medianDifference, maxGain, maxLoss },
  };
}

export async function getFighterPerformanceProfile(
  fighterId: string
): Promise<FighterPerformanceProfile | null> {
  const fighter = await prisma.fighter.findUnique({
    where: { id: fighterId },
    include: {
      fightsAsA: {
        include: {
          fighterB: true,
          winner: true,
          fightStats: { where: { fighterId } },
        },
        orderBy: { date: "desc" },
        take: 10,
      },
      fightsAsB: {
        include: {
          fighterA: true,
          winner: true,
          fightStats: { where: { fighterId } },
        },
        orderBy: { date: "desc" },
        take: 10,
      },
      fightStats: true,
    },
  });

  if (!fighter) return null;

  // Get the latest calc run
  const calcRun = await prisma.calcRun.findFirst({
    where: { usePerformanceElo: true },
    orderBy: { createdAt: "desc" },
  });

  // Get the latest rating snapshot by fight date
  const latestRating = calcRun
    ? await prisma.ratingSnapshot.findFirst({
        where: {
          fighterId: fighter.id,
          calcRunId: calcRun.id,
          fightId: { not: null },
        },
        include: { fight: true },
        orderBy: {
          fight: { date: "desc" },
        },
      })
    : null;

  const classic = latestRating?.rating ?? 1500;
  const performance = latestRating?.performanceRating ?? classic;

  const allFights = [
    ...fighter.fightsAsA.map((f) => ({
      ...f,
      opponent: f.fighterB,
      isA: true,
    })),
    ...fighter.fightsAsB.map((f) => ({
      ...f,
      opponent: f.fighterA,
      isA: false,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const wins = allFights.filter((f) => f.winner?.id === fighterId).length;
  const losses = allFights.filter(
    (f) => f.winner && f.winner.id !== fighterId
  ).length;
  const draws = allFights.filter((f) => !f.winner).length;

  const finishes = allFights.filter(
    (f) =>
      f.winner?.id === fighterId &&
      (f.method === "KO" || f.method === "TKO" || f.method === "SUBMISSION")
  ).length;

  const decisions = wins - finishes;

  const stats = fighter.fightStats;
  const avgKnockdowns =
    stats.reduce((sum, s) => sum + s.knockdowns, 0) / (stats.length || 1);
  const avgSigStrikeAccuracy =
    stats.reduce(
      (sum, s) =>
        sum +
        (s.sigStrikesAttempted > 0
          ? s.sigStrikesLanded / s.sigStrikesAttempted
          : 0),
      0
    ) / (stats.length || 1);
  const avgTakedownAccuracy =
    stats.reduce(
      (sum, s) =>
        sum +
        (s.takedownsAttempted > 0
          ? s.takedownsLanded / s.takedownsAttempted
          : 0),
      0
    ) / (stats.length || 1);
  const avgControlTime =
    stats.reduce((sum, s) => sum + s.controlTimeSeconds, 0) /
    (stats.length || 1);

  const dominantWins = stats.filter(
    (s) => s.isWinner && (s.knockdowns >= 2 || s.controlTimeSeconds > 180)
  ).length;

  const recentFights = allFights.slice(0, 10).map((f) => ({
    id: f.id,
    date: f.date,
    opponent: { id: f.opponent.id, name: f.opponent.name },
    result: (f.winner?.id === fighterId
      ? "win"
      : f.winner
        ? "loss"
        : "draw") as "win" | "loss" | "draw",
    method: f.method,
    classicChange: 0,
    performanceChange: 0,
  }));

  return {
    fighter: {
      id: fighter.id,
      name: fighter.name,
      nickname: fighter.nickname,
      weightClass: fighter.weightClass,
    },
    ratings: {
      classic,
      performance,
      diff: performance - classic,
    },
    fightStats: {
      total: allFights.length,
      wins,
      losses,
      draws,
      finishes,
      decisions,
    },
    performanceMetrics: {
      avgKnockdowns,
      avgSigStrikeAccuracy,
      avgTakedownAccuracy,
      avgControlTime,
      dominantWins,
    },
    recentFights,
  };
}

export async function getWeightClasses(): Promise<string[]> {
  const classes = await prisma.fighter.findMany({
    select: { weightClass: true },
    distinct: ["weightClass"],
    orderBy: { weightClass: "asc" },
  });

  return classes.map((c) => c.weightClass);
}
