/**
 * Performance-based Elo multipliers
 * "HOW you win matters as much as WHO you beat"
 */

export type FightPerformanceData = {
  method: string;
  rounds: number;
  finishRound?: number;
  weightClass?: string;
  isTitle?: boolean;
  stats?: {
    fighterA: FighterStats;
    fighterB: FighterStats;
  };
};

export type FighterStats = {
  knockdowns: number;
  sigStrikesLanded: number;
  sigStrikesAttempted: number;
  totalStrikesLanded: number;
  takedownsLanded: number;
  takedownsAttempted: number;
  controlTimeSeconds: number;
};

export type PerformanceMultipliers = {
  finishQuality: number;
  domination: number;
  roundEfficiency: number;
  activityPenalty: number;
  weightClassAdjustment: number;
  titleBonus: number;
  combined: number;
};

/**
 * 1. Finish Quality Multiplier (0.8 - 1.4x)
 * How definitive was the victory?
 */
export function calculateFinishQuality(
  method: string,
  winner: "fighterA" | "fighterB" | "draw" | "no-contest"
): number {
  if (winner === "draw" || winner === "no-contest") return 0.5;

  const methodLower = method.toLowerCase();

  // Decision quality (based on judge agreement)
  if (methodLower.includes("decision")) {
    if (methodLower.includes("split")) return 0.8;
    if (methodLower.includes("majority")) return 0.9;
    return 1.0; // Unanimous
  }

  // Submissions
  if (methodLower.includes("submission")) {
    // Early submission (rounds 1-2) shows dominance
    return 1.3;
  }

  // Knockouts
  if (methodLower.includes("ko") && !methodLower.includes("tko")) {
    return 1.4; // Clean knockout - most definitive
  }

  // TKO
  if (methodLower.includes("tko")) {
    return 1.25;
  }

  // Default for other stoppages
  return 1.15;
}

/**
 * 2. Domination Score (0.85 - 1.3x)
 * Statistical dominance analysis
 */
export function calculateDominationScore(
  winner: "fighterA" | "fighterB",
  stats?: { fighterA: FighterStats; fighterB: FighterStats },
  rounds: number = 3
): number {
  if (!stats) return 1.0; // No stats = baseline

  const winnerStats = winner === "fighterA" ? stats.fighterA : stats.fighterB;
  const loserStats = winner === "fighterA" ? stats.fighterB : stats.fighterA;

  // Calculate components
  const strikeDiff = calculateStrikeDifferential(winnerStats, loserStats);
  const kdDiff = calculateKnockdownDifferential(winnerStats, loserStats);
  const tdControl = calculateTakedownControl(winnerStats, loserStats);
  const controlDiff = calculateControlDifferential(winnerStats, loserStats);

  // Weighted combination
  const dominationRaw =
    strikeDiff * 0.4 + kdDiff * 0.25 + tdControl * 0.2 + controlDiff * 0.15;

  // Normalize by rounds
  const dominationPerRound = dominationRaw / rounds;

  // Map to multiplier range (0.85 - 1.3)
  // dominationPerRound ranges roughly from -0.5 to 1.5
  const multiplier = 1.0 + dominationPerRound * 0.3;

  return Math.max(0.85, Math.min(1.3, multiplier));
}

function calculateStrikeDifferential(
  winner: FighterStats,
  loser: FighterStats
): number {
  const totalStrikes = winner.sigStrikesLanded + loser.sigStrikesLanded;
  if (totalStrikes === 0) return 0;

  const differential = winner.sigStrikesLanded - loser.sigStrikesLanded;
  return differential / totalStrikes;
}

function calculateKnockdownDifferential(
  winner: FighterStats,
  loser: FighterStats
): number {
  const kdDiff = winner.knockdowns - loser.knockdowns;
  // Each knockdown differential is worth 0.3 points
  return kdDiff * 0.3;
}

function calculateTakedownControl(
  winner: FighterStats,
  loser: FighterStats
): number {
  const winnerTdRate =
    winner.takedownsAttempted > 0
      ? winner.takedownsLanded / winner.takedownsAttempted
      : 0;
  const loserTdRate =
    loser.takedownsAttempted > 0
      ? loser.takedownsLanded / loser.takedownsAttempted
      : 0;

  const winnerControl = winnerTdRate * (winner.controlTimeSeconds / 60);
  const loserControl = loserTdRate * (loser.controlTimeSeconds / 60);

  const totalControl = winnerControl + loserControl;
  if (totalControl === 0) return 0;

  return (winnerControl - loserControl) / totalControl;
}

function calculateControlDifferential(
  winner: FighterStats,
  loser: FighterStats
): number {
  const totalControl = winner.controlTimeSeconds + loser.controlTimeSeconds;
  if (totalControl === 0) return 0;

  return (
    (winner.controlTimeSeconds - loser.controlTimeSeconds) / totalControl
  );
}

/**
 * 3. Round Efficiency Bonus (0.95 - 1.2x)
 * Reward early finishes, penalize going the distance
 */
export function calculateRoundEfficiency(
  method: string,
  totalRounds: number,
  finishRound?: number
): number {
  const methodLower = method.toLowerCase();
  const isDecision = methodLower.includes("decision");

  if (isDecision) {
    // Decision: slight penalty for 5-round wars
    return totalRounds === 5 ? 0.95 : 1.0;
  }

  // Finish: reward based on how quickly
  if (!finishRound) return 1.0;

  switch (finishRound) {
    case 1:
      return 1.2; // Instant domination
    case 2:
      return 1.1; // Quick work
    case 3:
      return 1.05; // Standard finish
    case 4:
      return 1.05; // Championship persistence
    case 5:
      return 1.0; // Late finish
    default:
      return 1.0;
  }
}

/**
 * 4. Activity Penalty (0.9 - 1.0x)
 * Discourage boring point-fighting decisions
 */
export function calculateActivityPenalty(
  method: string,
  stats?: { fighterA: FighterStats; fighterB: FighterStats },
  fightTimeMinutes?: number
): number {
  const methodLower = method.toLowerCase();
  if (!methodLower.includes("decision") || !stats || !fightTimeMinutes) {
    return 1.0; // Only applies to decisions with stats
  }

  const totalStrikes =
    stats.fighterA.totalStrikesLanded + stats.fighterB.totalStrikesLanded;
  const strikesPerMinute = totalStrikes / fightTimeMinutes;

  if (strikesPerMinute < 3) return 0.9; // Lay-and-pray
  if (strikesPerMinute < 5) return 0.95; // Low activity
  return 1.0; // Active fight
}

/**
 * 5. Weight Class Adjustment (0.95 - 1.05x)
 * Smaller fighters naturally have higher pace
 */
export function calculateWeightClassAdjustment(
  weightClass?: string
): number {
  if (!weightClass) return 1.0;

  const wc = weightClass.toLowerCase();

  if (wc.includes("flyweight") || wc.includes("bantamweight")) {
    return 1.05; // Faster pace expected
  }

  if (wc.includes("heavyweight") || wc.includes("light heavyweight")) {
    return 0.95; // Slower pace natural
  }

  return 1.0; // Middle weights
}

/**
 * 6. Title Fight Bonus (1.0 - 1.08x)
 * Championship rounds and title defenses
 */
export function calculateTitleBonus(isTitle: boolean, rounds: number): number {
  if (!isTitle) return 1.0;

  let bonus = 1.0;

  if (rounds === 5) {
    bonus += 0.05; // Championship rounds
  }

  // Could add defense bonus if we track title holder
  // bonus += 0.03 for defending champion

  return bonus;
}

/**
 * Master function: Calculate all multipliers
 */
export function calculatePerformanceMultipliers(
  winner: "fighterA" | "fighterB" | "draw" | "no-contest",
  performance: FightPerformanceData
): PerformanceMultipliers {
  const finishQuality = calculateFinishQuality(performance.method, winner);

  const domination =
    winner === "fighterA" || winner === "fighterB"
      ? calculateDominationScore(winner, performance.stats, performance.rounds)
      : 1.0;

  const roundEfficiency = calculateRoundEfficiency(
    performance.method,
    performance.rounds,
    performance.finishRound
  );

  const fightTimeMinutes = performance.finishRound
    ? (performance.finishRound - 1) * 5 + 2.5 // Estimate
    : performance.rounds * 5;

  const activityPenalty = calculateActivityPenalty(
    performance.method,
    performance.stats,
    fightTimeMinutes
  );

  const weightClassAdjustment = calculateWeightClassAdjustment(
    performance.weightClass
  );

  const titleBonus = calculateTitleBonus(
    performance.isTitle ?? false,
    performance.rounds
  );

  const combined =
    finishQuality *
    domination *
    roundEfficiency *
    activityPenalty *
    weightClassAdjustment *
    titleBonus;

  return {
    finishQuality,
    domination,
    roundEfficiency,
    activityPenalty,
    weightClassAdjustment,
    titleBonus,
    combined,
  };
}
