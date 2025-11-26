import { applyFight, simulateFight, type EloConfig, type FightInput, type RatingState } from "./engine";

export type FightResult = {
  fight: FightInput;
  expected: { fighterA: number; fighterB: number };
  deltas: { fighterA: number; fighterB: number };
  ratingsAfter: { fighterA: number; fighterB: number };
};

export type RunResult = {
  ratings: RatingState;
  history: FightResult[];
};

type RunOptions = {
  initialRatings?: RatingState;
};

/**
 * Replay fights in chronological order and return rating history.
 */
export function runElo(
  fights: FightInput[],
  config: EloConfig,
  options: RunOptions = {}
): RunResult {
  const sorted = [...fights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let ratings: RatingState = { ...options.initialRatings };
  const history: FightResult[] = [];

  for (const fight of sorted) {
    const sim = simulateFight(fight, ratings, config);
    ratings = applyFight(fight, ratings, config);

    history.push({
      fight,
      expected: sim.expected,
      deltas: sim.deltas,
      ratingsAfter: sim.nextRatings,
    });
  }

  return { ratings, history };
}
