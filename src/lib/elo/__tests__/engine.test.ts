import { describe, it, expect } from 'vitest';
import { simulateFight, applyFight, type FightInput, type EloConfig, type RatingState } from '../engine';

// Test helpers
const createFight = (overrides: Partial<FightInput> = {}): FightInput => ({
  date: '2024-01-01',
  fighterA: 'Fighter A',
  fighterB: 'Fighter B',
  winner: 'fighterA',
  method: 'KO',
  weightClass: 'Welterweight',
  rounds: 3,
  event: 'Test Event',
  ...overrides,
});

const defaultConfig: EloConfig = {
  baseRating: 1500,
  baseK: 32,
  minK: 16,
  upsetBonusPct: 20,
  drawDelta: 0.5,
};

const createRatings = (overrides: Record<string, number> = {}): RatingState => ({
  'Fighter A': 1500,
  'Fighter B': 1500,
  ...overrides,
});

describe('Classic Elo Engine', () => {
  describe('simulateFight', () => {
    describe('Expected scores', () => {
      it('should give equal-rated fighters 0.5/0.5 expected scores', () => {
        const fight = createFight();
        const ratings = createRatings();
        const result = simulateFight(fight, ratings, defaultConfig);

        expect(result.expected.fighterA).toBeCloseTo(0.5, 5);
        expect(result.expected.fighterB).toBeCloseTo(0.5, 5);
      });

      it('should give higher-rated fighter >0.5 expected score', () => {
        const fight = createFight();
        const ratings = createRatings({
          'Fighter A': 1600,
          'Fighter B': 1500,
        });
        const result = simulateFight(fight, ratings, defaultConfig);

        expect(result.expected.fighterA).toBeGreaterThan(0.5);
        expect(result.expected.fighterB).toBeLessThan(0.5);
        // Expected scores should sum to 1
        expect(result.expected.fighterA + result.expected.fighterB).toBeCloseTo(1, 5);
      });
    });

    describe('Rating math', () => {
      it('should be zero-sum (winner gains = loser loses in absolute terms)', () => {
        const fight = createFight();
        const ratings = createRatings();
        const result = simulateFight(fight, ratings, defaultConfig);

        expect(Math.abs(result.deltas.fighterA)).toBeCloseTo(Math.abs(result.deltas.fighterB), 5);
        expect(result.deltas.fighterA).toBeGreaterThan(0);
        expect(result.deltas.fighterB).toBeLessThan(0);
      });

      it('should award more points for beating higher-rated opponent', () => {
        const weakOpponentFight = createFight();
        const weakOpponentRatings = createRatings({
          'Fighter A': 1600,
          'Fighter B': 1400,
        });

        const strongOpponentFight = createFight();
        const strongOpponentRatings = createRatings({
          'Fighter A': 1400,
          'Fighter B': 1600,
        });

        const weakResult = simulateFight(weakOpponentFight, weakOpponentRatings, defaultConfig);
        const strongResult = simulateFight(strongOpponentFight, strongOpponentRatings, defaultConfig);

        // Beating a higher-rated opponent should give more points
        expect(strongResult.deltas.fighterA).toBeGreaterThan(weakResult.deltas.fighterA);
      });
    });

    describe('Base rating', () => {
      it('should use baseRating for unknown fighters', () => {
        const fight = createFight({
          fighterA: 'Unknown Fighter 1',
          fighterB: 'Unknown Fighter 2',
        });
        const ratings = createRatings(); // No ratings for these fighters
        const result = simulateFight(fight, ratings, defaultConfig);

        // Both start at base rating, so expected should be 0.5/0.5
        expect(result.expected.fighterA).toBeCloseTo(0.5, 5);
        expect(result.expected.fighterB).toBeCloseTo(0.5, 5);
      });
    });

    describe('Upset bonus', () => {
      it('should apply bonus when underdog wins by 50+ rating gap', () => {
        const fight = createFight({
          winner: 'fighterA',
        });
        const ratings = createRatings({
          'Fighter A': 1400,
          'Fighter B': 1550, // 150 point gap
        });
        const config = { ...defaultConfig, upsetBonusPct: 20 };
        const result = simulateFight(fight, ratings, config);

        // Calculate what the delta would be without upset bonus
        const noUpsetConfig = { ...config, upsetBonusPct: 0 };
        const noUpsetResult = simulateFight(fight, ratings, noUpsetConfig);

        // With upset bonus should be larger
        expect(Math.abs(result.deltas.fighterA)).toBeGreaterThan(Math.abs(noUpsetResult.deltas.fighterA));
        // Should be roughly 1.2x (20% bonus)
        expect(Math.abs(result.deltas.fighterA) / Math.abs(noUpsetResult.deltas.fighterA)).toBeCloseTo(1.2, 2);
      });

      it('should not apply bonus when favorite wins', () => {
        const fight = createFight({
          winner: 'fighterA',
        });
        const ratings = createRatings({
          'Fighter A': 1600,
          'Fighter B': 1400, // Favorite wins
        });
        const config = { ...defaultConfig, upsetBonusPct: 20 };
        const result = simulateFight(fight, ratings, config);

        const noUpsetConfig = { ...config, upsetBonusPct: 0 };
        const noUpsetResult = simulateFight(fight, ratings, noUpsetConfig);

        // Should be the same (no bonus applied)
        expect(Math.abs(result.deltas.fighterA)).toBeCloseTo(Math.abs(noUpsetResult.deltas.fighterA), 5);
      });

      it('should not apply bonus when gap is less than 50 points', () => {
        const fight = createFight({
          winner: 'fighterA',
        });
        const ratings = createRatings({
          'Fighter A': 1480,
          'Fighter B': 1520, // 40 point gap
        });
        const config = { ...defaultConfig, upsetBonusPct: 20 };
        const result = simulateFight(fight, ratings, config);

        const noUpsetConfig = { ...config, upsetBonusPct: 0 };
        const noUpsetResult = simulateFight(fight, ratings, noUpsetConfig);

        // Should be the same (gap too small)
        expect(Math.abs(result.deltas.fighterA)).toBeCloseTo(Math.abs(noUpsetResult.deltas.fighterA), 5);
      });
    });

    describe('Draw', () => {
      it('should move both fighters toward each other slightly', () => {
        const fight = createFight({
          winner: 'draw',
        });
        const ratings = createRatings({
          'Fighter A': 1600,
          'Fighter B': 1400,
        });
        const result = simulateFight(fight, ratings, defaultConfig);

        // Higher rated fighter should lose rating, lower should gain
        expect(result.deltas.fighterA).toBeLessThan(0);
        expect(result.deltas.fighterB).toBeGreaterThan(0);
        
        // Should still be zero-sum
        expect(Math.abs(result.deltas.fighterA)).toBeCloseTo(Math.abs(result.deltas.fighterB), 5);
      });
    });

    describe('No-contest', () => {
      it('should penalize both fighters (both get 0 actual score)', () => {
        const fight = createFight({
          winner: 'no-contest',
        });
        const ratings = createRatings();
        const result = simulateFight(fight, ratings, defaultConfig);

        // Both fighters should lose rating
        expect(result.deltas.fighterA).toBeLessThan(0);
        expect(result.deltas.fighterB).toBeLessThan(0);
      });
    });

    describe('K-factor', () => {
      it('should produce bigger swings with higher K', () => {
        const fight = createFight();
        const ratings = createRatings();

        const lowKConfig = { ...defaultConfig, baseK: 16, minK: 16 };
        const highKConfig = { ...defaultConfig, baseK: 64, minK: 32 };

        const lowKResult = simulateFight(fight, ratings, lowKConfig);
        const highKResult = simulateFight(fight, ratings, highKConfig);

        expect(Math.abs(highKResult.deltas.fighterA)).toBeGreaterThan(Math.abs(lowKResult.deltas.fighterA));
      });
    });

    describe('Idempotency', () => {
      it('should give different results when same fight applied twice (ratings changed)', () => {
        const fight = createFight();
        const initialRatings = createRatings();

        // First application
        const firstResult = simulateFight(fight, initialRatings, defaultConfig);
        const afterFirstRatings = applyFight(fight, initialRatings, defaultConfig);

        // Second application
        const secondResult = simulateFight(fight, afterFirstRatings, defaultConfig);

        // Results should be different because ratings changed
        expect(secondResult.deltas.fighterA).not.toBeCloseTo(firstResult.deltas.fighterA, 5);
        expect(secondResult.deltas.fighterB).not.toBeCloseTo(firstResult.deltas.fighterB, 5);
      });
    });
  });

  describe('applyFight', () => {
    it('should update both fighter ratings', () => {
      const fight = createFight();
      const ratings = createRatings();
      const newRatings = applyFight(fight, ratings, defaultConfig);

      expect(newRatings['Fighter A']).not.toBe(1500);
      expect(newRatings['Fighter B']).not.toBe(1500);
      expect(newRatings['Fighter A']).toBeGreaterThan(1500); // Winner gains
      expect(newRatings['Fighter B']).toBeLessThan(1500); // Loser loses
    });

    it('should preserve other fighter ratings', () => {
      const fight = createFight();
      const ratings = createRatings({
        'Fighter A': 1500,
        'Fighter B': 1500,
        'Other Fighter': 1700,
      });
      const newRatings = applyFight(fight, ratings, defaultConfig);

      expect(newRatings['Other Fighter']).toBe(1700);
    });
  });
});
