type Winner = "fighterA" | "fighterB" | "draw" | "no-contest";

export type FightInput = {
  date: string; // ISO date
  fighterA: string;
  fighterB: string;
  winner: Winner;
  method?: string;
  weightClass?: string;
  rounds?: number;
  event?: string;
};

export type EloConfig = {
  baseRating: number;
  baseK: number;
  minK: number;
  upsetBonusPct?: number; // percent bonus applied when lower rated fighter wins
  drawDelta?: number; // rating movement for a draw
};

export type RatingState = Record<string, number>;

export type SimulationResult = {
  expected: { fighterA: number; fighterB: number };
  nextRatings: { fighterA: number; fighterB: number };
  deltas: { fighterA: number; fighterB: number };
};

const RATING_WIDTH = 400;

const getK = (config: EloConfig) => Math.max(config.minK, config.baseK);

const expectedScore = (rating: number, opponentRating: number) => {
  return 1 / (1 + 10 ** ((opponentRating - rating) / RATING_WIDTH));
};

export const simulateFight = (
  fight: FightInput,
  ratings: RatingState,
  config: EloConfig
): SimulationResult => {
  const aRating = ratings[fight.fighterA] ?? config.baseRating;
  const bRating = ratings[fight.fighterB] ?? config.baseRating;
  const k = getK(config);

  const expectedA = expectedScore(aRating, bRating);
  const expectedB = 1 - expectedA;

  const actual = getActualScores(fight.winner);
  const bonusMultiplier = getUpsetBonusMultiplier({
    winner: fight.winner,
    aRating,
    bRating,
    upsetBonusPct: config.upsetBonusPct,
  });

  const deltaA = k * bonusMultiplier * (actual.a - expectedA);
  const deltaB = k * bonusMultiplier * (actual.b - expectedB);

  return {
    expected: { fighterA: expectedA, fighterB: expectedB },
    nextRatings: { fighterA: aRating + deltaA, fighterB: bRating + deltaB },
    deltas: { fighterA: deltaA, fighterB: deltaB },
  };
};

export const applyFight = (
  fight: FightInput,
  ratings: RatingState,
  config: EloConfig
): RatingState => {
  const result = simulateFight(fight, ratings, config);

  return {
    ...ratings,
    [fight.fighterA]: result.nextRatings.fighterA,
    [fight.fighterB]: result.nextRatings.fighterB,
  };
};

const getUpsetBonusMultiplier = ({
  winner,
  aRating,
  bRating,
  upsetBonusPct = 0,
}: {
  winner: Winner;
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

const getActualScores = (winner: Winner) => {
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
