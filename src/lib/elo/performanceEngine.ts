/**
 * Performance-Weighted Elo Engine
 * Incorporates fight statistics to reward dominant performances
 */

import type { EloConfig, FightInput, RatingState, SimulationResult } from "./engine";
import {
  calculatePerformanceMultipliers,
  type FightPerformanceData,
  type FighterStats,
  type PerformanceMultipliers,
} from "./performanceMultipliers";

const RATING_WIDTH = 400;

export type PerformanceEloConfig = EloConfig & {
  usePerformanceMultipliers?: boolean;
};

export type PerformanceSimulationResult = SimulationResult & {
  performanceMultipliers?: PerformanceMultipliers;
  adjustedK?: number;
};

const getK = (config: EloConfig) => Math.max(config.minK, config.baseK);

const expectedScore = (rating: number, opponentRating: number) => {
  return 1 / (1 + 10 ** ((opponentRating - rating) / RATING_WIDTH));
};

const getActualScores = (winner: "fighterA" | "fighterB" | "draw" | "no-contest") => {
  switch (winner) {
    case "fighterA":
      return { a: 1, b: 0 };
    case "fighterB":
      return { a: 0, b: 1 };
    case "draw":
      return { a: 0.5, b: 0.5 };
    default:
      return { a: 0, b: 0 };
  }
};

const getUpsetBonusMultiplier = ({
  winner,
  aRating,
  bRating,
  upsetBonusPct = 0,
}: {
  winner: "fighterA" | "fighterB" | "draw" | "no-contest";
  aRating: number;
  bRating: number;
  upsetBonusPct?: number;
}) => {
  if (winner === "draw" || winner === "no-contest" || upsetBonusPct <= 0) {
    return 1;
  }

  const offset = Math.abs(aRating - bRating);
  const underdogWon =
    (winner === "fighterA" && aRating < bRating) ||
    (winner === "fighterB" && bRating < aRating);

  if (!underdogWon || offset < 50) return 1;

  return 1 + upsetBonusPct / 100;
};

/**
 * Simulate fight with performance-weighted Elo
 */
export function simulatePerformanceFight(
  fight: FightInput,
  ratings: RatingState,
  config: PerformanceEloConfig,
  performanceData?: FightPerformanceData
): PerformanceSimulationResult {
  const aRating = ratings[fight.fighterA] ?? config.baseRating;
  const bRating = ratings[fight.fighterB] ?? config.baseRating;

  const expectedA = expectedScore(aRating, bRating);
  const expectedB = 1 - expectedA;

  const actual = getActualScores(fight.winner);
  const upsetBonus = getUpsetBonusMultiplier({
    winner: fight.winner,
    aRating,
    bRating,
    upsetBonusPct: config.upsetBonusPct,
  });

  const baseK = getK(config);
  let performanceMultipliers: PerformanceMultipliers | undefined;
  let adjustedK = baseK;

  // Apply performance multipliers if enabled and data available
  if (config.usePerformanceMultipliers && performanceData) {
    performanceMultipliers = calculatePerformanceMultipliers(
      fight.winner,
      performanceData
    );
    adjustedK = baseK * upsetBonus * performanceMultipliers.combined;
  } else {
    adjustedK = baseK * upsetBonus;
  }

  const deltaA = adjustedK * (actual.a - expectedA);
  const deltaB = adjustedK * (actual.b - expectedB);

  return {
    expected: { fighterA: expectedA, fighterB: expectedB },
    nextRatings: { fighterA: aRating + deltaA, fighterB: bRating + deltaB },
    deltas: { fighterA: deltaA, fighterB: deltaB },
    performanceMultipliers,
    adjustedK,
  };
}

/**
 * Apply performance-weighted fight and update ratings
 */
export function applyPerformanceFight(
  fight: FightInput,
  ratings: RatingState,
  config: PerformanceEloConfig,
  performanceData?: FightPerformanceData
): RatingState {
  const result = simulatePerformanceFight(fight, ratings, config, performanceData);

  return {
    ...ratings,
    [fight.fighterA]: result.nextRatings.fighterA,
    [fight.fighterB]: result.nextRatings.fighterB,
  };
}

/**
 * Helper to convert database FightStats to FighterStats format
 */
export function convertFightStatsToPerformanceData(
  fightStats: Array<{
    fighterId: string;
    knockdowns: number;
    sigStrikesLanded: number;
    sigStrikesAttempted: number;
    totalStrikesLanded: number;
    takedownsLanded: number;
    takedownsAttempted: number;
    controlTimeSeconds: number;
  }>,
  fighterAId: string,
  fighterBId: string
): { fighterA: FighterStats; fighterB: FighterStats } | undefined {
  const statsA = fightStats.find((s) => s.fighterId === fighterAId);
  const statsB = fightStats.find((s) => s.fighterId === fighterBId);

  if (!statsA || !statsB) return undefined;

  return {
    fighterA: {
      knockdowns: statsA.knockdowns,
      sigStrikesLanded: statsA.sigStrikesLanded,
      sigStrikesAttempted: statsA.sigStrikesAttempted,
      totalStrikesLanded: statsA.totalStrikesLanded,
      takedownsLanded: statsA.takedownsLanded,
      takedownsAttempted: statsA.takedownsAttempted,
      controlTimeSeconds: statsA.controlTimeSeconds,
    },
    fighterB: {
      knockdowns: statsB.knockdowns,
      sigStrikesLanded: statsB.sigStrikesLanded,
      sigStrikesAttempted: statsB.sigStrikesAttempted,
      totalStrikesLanded: statsB.totalStrikesLanded,
      takedownsLanded: statsB.takedownsLanded,
      takedownsAttempted: statsB.takedownsAttempted,
      controlTimeSeconds: statsB.controlTimeSeconds,
    },
  };
}
