import { describe, it, expect } from 'vitest';
import {
  simulatePerformanceFight,
  applyPerformanceFight,
  convertFightStatsToPerformanceData,
  type PerformanceEloConfig,
} from '../performanceEngine';
import type { FightInput, RatingState } from '../engine';
import type { FightPerformanceData, FighterStats } from '../performanceMultipliers';

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

const defaultConfig: PerformanceEloConfig = {
  baseRating: 1500,
  baseK: 32,
  minK: 16,
  upsetBonusPct: 20,
  usePerformanceMultipliers: true,
};

const createRatings = (overrides: Record<string, number> = {}): RatingState => ({
  'Fighter A': 1500,
  'Fighter B': 1500,
  ...overrides,
});

const createFighterStats = (overrides: Partial<FighterStats> = {}): FighterStats => ({
  knockdowns: 0,
  sigStrikesLanded: 50,
  sigStrikesAttempted: 100,
  totalStrikesLanded: 60,
  takedownsLanded: 0,
  takedownsAttempted: 0,
  controlTimeSeconds: 0,
  ...overrides,
});

const createPerformanceData = (overrides: Partial<FightPerformanceData> = {}): FightPerformanceData => ({
  method: 'KO',
  rounds: 3,
  finishRound: 1,
  weightClass: 'Welterweight',
  isTitle: false,
  ...overrides,
});

describe('Performance Elo Engine', () => {
  describe('simulatePerformanceFight', () => {
    describe('Without performance data', () => {
      it('should behave like classic Elo (same expected scores)', () => {
        const fight = createFight();
        const ratings = createRatings();
        const config = { ...defaultConfig, usePerformanceMultipliers: false };

        const result = simulatePerformanceFight(fight, ratings, config);

        expect(result.expected.fighterA).toBeCloseTo(0.5, 5);
        expect(result.expected.fighterB).toBeCloseTo(0.5, 5);
      });

      it('should apply upset bonus without performance multipliers', () => {
        const fight = createFight({
          winner: 'fighterA',
        });
        const ratings = createRatings({
          'Fighter A': 1400,
          'Fighter B': 1550,
        });
        const config = { ...defaultConfig, usePerformanceMultipliers: false, upsetBonusPct: 20 };

        const result = simulatePerformanceFight(fight, ratings, config);

        // Should have upset bonus but no performance multiplier
        expect(result.adjustedK).toBeGreaterThan(config.baseK);
        expect(result.performanceMultipliers).toBeUndefined();
      });
    });

    describe('With performance data', () => {
      it('should adjust K-factor by combined multiplier', () => {
        const fight = createFight();
        const ratings = createRatings();
        const performanceData = createPerformanceData({
          method: 'KO',
          finishRound: 1,
        });

        const withoutPerformance = simulatePerformanceFight(
          fight,
          ratings,
          { ...defaultConfig, usePerformanceMultipliers: false }
        );

        const withPerformance = simulatePerformanceFight(
          fight,
          ratings,
          defaultConfig,
          performanceData
        );

        // With performance should have larger rating changes
        expect(Math.abs(withPerformance.deltas.fighterA)).toBeGreaterThan(
          Math.abs(withoutPerformance.deltas.fighterA)
        );
        expect(withPerformance.performanceMultipliers).toBeDefined();
        expect(withPerformance.performanceMultipliers!.combined).toBeGreaterThan(1.0);
      });

      it('should give higher rating change for KO than decision', () => {
        const koFight = createFight({
          method: 'KO',
        });
        const decisionFight = createFight({
          method: 'Unanimous Decision',
        });
        const ratings = createRatings();

        const koPerformance = createPerformanceData({
          method: 'KO',
          finishRound: 1,
        });

        const decisionPerformance = createPerformanceData({
          method: 'Unanimous Decision',
          finishRound: undefined,
        });

        const koResult = simulatePerformanceFight(koFight, ratings, defaultConfig, koPerformance);
        const decisionResult = simulatePerformanceFight(
          decisionFight,
          ratings,
          defaultConfig,
          decisionPerformance
        );

        // KO should result in bigger rating change
        expect(Math.abs(koResult.deltas.fighterA)).toBeGreaterThan(
          Math.abs(decisionResult.deltas.fighterA)
        );
      });

      it('should return performance multipliers in result', () => {
        const fight = createFight();
        const ratings = createRatings();
        const performanceData = createPerformanceData({
          method: 'Submission',
          finishRound: 2,
          isTitle: true,
          rounds: 5,
        });

        const result = simulatePerformanceFight(fight, ratings, defaultConfig, performanceData);

        expect(result.performanceMultipliers).toBeDefined();
        expect(result.performanceMultipliers!.finishQuality).toBe(1.3); // Submission
        expect(result.performanceMultipliers!.roundEfficiency).toBe(1.1); // R2 finish
        expect(result.performanceMultipliers!.titleBonus).toBe(1.05); // Title 5 rounds
      });

      it('should combine upset bonus with performance multipliers in adjustedK', () => {
        const fight = createFight({
          winner: 'fighterA',
        });
        const ratings = createRatings({
          'Fighter A': 1400,
          'Fighter B': 1600, // Big underdog
        });
        const performanceData = createPerformanceData({
          method: 'KO',
          finishRound: 1, // Dominant finish
        });
        const config = { ...defaultConfig, upsetBonusPct: 20 };

        const result = simulatePerformanceFight(fight, ratings, config, performanceData);

        // adjustedK should reflect both upset bonus (1.2x) and performance multiplier
        const upsetMultiplier = 1.2;
        const expectedMinK = config.baseK * upsetMultiplier * 1.4; // At least KO bonus

        expect(result.adjustedK).toBeGreaterThan(expectedMinK);
        expect(result.performanceMultipliers).toBeDefined();
      });

      it('should handle performance data with fight stats', () => {
        const fight = createFight();
        const ratings = createRatings();
        const performanceData = createPerformanceData({
          method: 'TKO',
          finishRound: 2,
          stats: {
            fighterA: createFighterStats({
              sigStrikesLanded: 100,
              knockdowns: 2,
            }),
            fighterB: createFighterStats({
              sigStrikesLanded: 30,
              knockdowns: 0,
            }),
          },
        });

        const result = simulatePerformanceFight(fight, ratings, defaultConfig, performanceData);

        expect(result.performanceMultipliers).toBeDefined();
        expect(result.performanceMultipliers!.domination).toBeGreaterThan(1.0);
      });
    });

    describe('Edge cases', () => {
      it('should handle draw with performance data', () => {
        const fight = createFight({
          winner: 'draw',
        });
        const ratings = createRatings();
        const performanceData = createPerformanceData({
          method: 'Draw',
        });

        const result = simulatePerformanceFight(fight, ratings, defaultConfig, performanceData);

        expect(result.performanceMultipliers).toBeDefined();
        expect(result.performanceMultipliers!.finishQuality).toBe(0.5);
      });

      it('should handle no-contest with performance data', () => {
        const fight = createFight({
          winner: 'no-contest',
        });
        const ratings = createRatings();
        const performanceData = createPerformanceData({
          method: 'No Contest',
        });

        const result = simulatePerformanceFight(fight, ratings, defaultConfig, performanceData);

        expect(result.performanceMultipliers).toBeDefined();
        expect(result.performanceMultipliers!.finishQuality).toBe(0.5);
        // Both fighters should lose rating
        expect(result.deltas.fighterA).toBeLessThan(0);
        expect(result.deltas.fighterB).toBeLessThan(0);
      });
    });
  });

  describe('applyPerformanceFight', () => {
    it('should update ratings based on performance', () => {
      const fight = createFight();
      const ratings = createRatings();
      const performanceData = createPerformanceData({
        method: 'KO',
        finishRound: 1,
      });

      const newRatings = applyPerformanceFight(fight, ratings, defaultConfig, performanceData);

      expect(newRatings['Fighter A']).toBeGreaterThan(ratings['Fighter A']);
      expect(newRatings['Fighter B']).toBeLessThan(ratings['Fighter B']);
    });

    it('should preserve other fighter ratings', () => {
      const fight = createFight();
      const ratings = createRatings({
        'Fighter A': 1500,
        'Fighter B': 1500,
        'Other Fighter': 1700,
      });
      const performanceData = createPerformanceData();

      const newRatings = applyPerformanceFight(fight, ratings, defaultConfig, performanceData);

      expect(newRatings['Other Fighter']).toBe(1700);
    });

    it('should work without performance data', () => {
      const fight = createFight();
      const ratings = createRatings();

      const newRatings = applyPerformanceFight(
        fight,
        ratings,
        { ...defaultConfig, usePerformanceMultipliers: false }
      );

      expect(newRatings['Fighter A']).not.toBe(ratings['Fighter A']);
      expect(newRatings['Fighter B']).not.toBe(ratings['Fighter B']);
    });
  });

  describe('convertFightStatsToPerformanceData', () => {
    it('should convert database stats to FighterStats format', () => {
      const fightStats = [
        {
          fighterId: 'fighter-a-id',
          knockdowns: 2,
          sigStrikesLanded: 80,
          sigStrikesAttempted: 120,
          totalStrikesLanded: 100,
          takedownsLanded: 3,
          takedownsAttempted: 5,
          controlTimeSeconds: 180,
        },
        {
          fighterId: 'fighter-b-id',
          knockdowns: 0,
          sigStrikesLanded: 40,
          sigStrikesAttempted: 100,
          totalStrikesLanded: 50,
          takedownsLanded: 1,
          takedownsAttempted: 4,
          controlTimeSeconds: 60,
        },
      ];

      const result = convertFightStatsToPerformanceData(
        fightStats,
        'fighter-a-id',
        'fighter-b-id'
      );

      expect(result).toBeDefined();
      expect(result!.fighterA.knockdowns).toBe(2);
      expect(result!.fighterA.sigStrikesLanded).toBe(80);
      expect(result!.fighterB.knockdowns).toBe(0);
      expect(result!.fighterB.sigStrikesLanded).toBe(40);
    });

    it('should handle missing stats for fighter A', () => {
      const fightStats = [
        {
          fighterId: 'fighter-b-id',
          knockdowns: 0,
          sigStrikesLanded: 40,
          sigStrikesAttempted: 100,
          totalStrikesLanded: 50,
          takedownsLanded: 1,
          takedownsAttempted: 4,
          controlTimeSeconds: 60,
        },
      ];

      const result = convertFightStatsToPerformanceData(
        fightStats,
        'fighter-a-id',
        'fighter-b-id'
      );

      expect(result).toBeUndefined();
    });

    it('should handle missing stats for fighter B', () => {
      const fightStats = [
        {
          fighterId: 'fighter-a-id',
          knockdowns: 2,
          sigStrikesLanded: 80,
          sigStrikesAttempted: 120,
          totalStrikesLanded: 100,
          takedownsLanded: 3,
          takedownsAttempted: 5,
          controlTimeSeconds: 180,
        },
      ];

      const result = convertFightStatsToPerformanceData(
        fightStats,
        'fighter-a-id',
        'fighter-b-id'
      );

      expect(result).toBeUndefined();
    });

    it('should handle empty stats array', () => {
      const result = convertFightStatsToPerformanceData([], 'fighter-a-id', 'fighter-b-id');

      expect(result).toBeUndefined();
    });
  });
});
