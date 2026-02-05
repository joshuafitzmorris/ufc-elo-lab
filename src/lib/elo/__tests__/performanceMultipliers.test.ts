import { describe, it, expect } from 'vitest';
import {
  calculateFinishQuality,
  calculateDominationScore,
  calculateRoundEfficiency,
  calculateActivityPenalty,
  calculateWeightClassAdjustment,
  calculateTitleBonus,
  calculatePerformanceMultipliers,
  type FighterStats,
  type FightPerformanceData,
} from '../performanceMultipliers';

// Test helpers
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

describe('Performance Multipliers', () => {
  describe('calculateFinishQuality', () => {
    it('should return 1.4 for KO', () => {
      expect(calculateFinishQuality('KO', 'fighterA')).toBe(1.4);
      expect(calculateFinishQuality('ko', 'fighterA')).toBe(1.4);
    });

    it('should return 1.25 for TKO', () => {
      expect(calculateFinishQuality('TKO', 'fighterA')).toBe(1.25);
      expect(calculateFinishQuality('tko', 'fighterA')).toBe(1.25);
    });

    it('should return 1.3 for Submission', () => {
      expect(calculateFinishQuality('Submission', 'fighterA')).toBe(1.3);
      expect(calculateFinishQuality('submission', 'fighterA')).toBe(1.3);
    });

    it('should return 1.0 for Unanimous Decision', () => {
      expect(calculateFinishQuality('Unanimous Decision', 'fighterA')).toBe(1.0);
      expect(calculateFinishQuality('unanimous decision', 'fighterA')).toBe(1.0);
    });

    it('should return 0.8 for Split Decision', () => {
      expect(calculateFinishQuality('Split Decision', 'fighterA')).toBe(0.8);
      expect(calculateFinishQuality('split decision', 'fighterA')).toBe(0.8);
    });

    it('should return 0.9 for Majority Decision', () => {
      expect(calculateFinishQuality('Majority Decision', 'fighterA')).toBe(0.9);
      expect(calculateFinishQuality('majority decision', 'fighterA')).toBe(0.9);
    });

    it('should return 0.5 for Draw', () => {
      expect(calculateFinishQuality('Draw', 'draw')).toBe(0.5);
    });

    it('should return 0.5 for No-Contest', () => {
      expect(calculateFinishQuality('No Contest', 'no-contest')).toBe(0.5);
    });
  });

  describe('calculateDominationScore', () => {
    it('should return 1.0 baseline when no stats provided', () => {
      expect(calculateDominationScore('fighterA', undefined)).toBe(1.0);
    });

    it('should return >1.0 when winner has much higher sig strikes', () => {
      const stats = {
        fighterA: createFighterStats({
          sigStrikesLanded: 150,
        }),
        fighterB: createFighterStats({
          sigStrikesLanded: 30,
        }),
      };

      const score = calculateDominationScore('fighterA', stats, 3);
      expect(score).toBeGreaterThan(1.0);
    });

    it('should return >1.0 when winner has knockdown advantage', () => {
      const stats = {
        fighterA: createFighterStats({
          knockdowns: 3,
        }),
        fighterB: createFighterStats({
          knockdowns: 0,
        }),
      };

      const score = calculateDominationScore('fighterA', stats, 3);
      expect(score).toBeGreaterThan(1.0);
    });

    it('should clamp result between 0.85 and 1.3', () => {
      // Extreme domination
      const extremeStats = {
        fighterA: createFighterStats({
          sigStrikesLanded: 500,
          knockdowns: 10,
          totalStrikesLanded: 600,
          controlTimeSeconds: 900,
        }),
        fighterB: createFighterStats({
          sigStrikesLanded: 5,
          knockdowns: 0,
          totalStrikesLanded: 10,
          controlTimeSeconds: 0,
        }),
      };

      const score = calculateDominationScore('fighterA', extremeStats, 5);
      expect(score).toBeLessThanOrEqual(1.3);
      expect(score).toBeGreaterThanOrEqual(0.85);
    });

    it('should handle loser dominating statistically (edge case)', () => {
      const stats = {
        fighterA: createFighterStats({
          sigStrikesLanded: 30,
        }),
        fighterB: createFighterStats({
          sigStrikesLanded: 150,
        }),
      };

      // Fighter A wins but had worse stats
      const score = calculateDominationScore('fighterA', stats, 3);
      expect(score).toBeLessThan(1.0);
      expect(score).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('calculateRoundEfficiency', () => {
    it('should return 1.2 for Round 1 finish', () => {
      expect(calculateRoundEfficiency('KO', 3, 1)).toBe(1.2);
    });

    it('should return 1.1 for Round 2 finish', () => {
      expect(calculateRoundEfficiency('Submission', 3, 2)).toBe(1.1);
    });

    it('should return 1.05 for Round 3 finish', () => {
      expect(calculateRoundEfficiency('TKO', 3, 3)).toBe(1.05);
    });

    it('should return 1.0 for 3-round decision', () => {
      expect(calculateRoundEfficiency('Unanimous Decision', 3)).toBe(1.0);
    });

    it('should return 0.95 for 5-round decision', () => {
      expect(calculateRoundEfficiency('Split Decision', 5)).toBe(0.95);
    });

    it('should return 1.05 for Round 4 finish', () => {
      expect(calculateRoundEfficiency('KO', 5, 4)).toBe(1.05);
    });

    it('should return 1.0 for Round 5 finish', () => {
      expect(calculateRoundEfficiency('Submission', 5, 5)).toBe(1.0);
    });
  });

  describe('calculateActivityPenalty', () => {
    it('should return 1.0 for non-decision fights', () => {
      const stats = {
        fighterA: createFighterStats(),
        fighterB: createFighterStats(),
      };

      expect(calculateActivityPenalty('KO', stats, 2)).toBe(1.0);
      expect(calculateActivityPenalty('TKO', stats, 5)).toBe(1.0);
      expect(calculateActivityPenalty('Submission', stats, 10)).toBe(1.0);
    });

    it('should return 1.0 for decision with high strikes per minute', () => {
      const stats = {
        fighterA: createFighterStats({
          totalStrikesLanded: 100,
        }),
        fighterB: createFighterStats({
          totalStrikesLanded: 100,
        }),
      };

      // 200 total strikes / 15 minutes = 13.3 strikes per minute
      expect(calculateActivityPenalty('Unanimous Decision', stats, 15)).toBe(1.0);
    });

    it('should return 0.9 for decision with very low strikes', () => {
      const stats = {
        fighterA: createFighterStats({
          totalStrikesLanded: 10,
        }),
        fighterB: createFighterStats({
          totalStrikesLanded: 10,
        }),
      };

      // 20 total strikes / 15 minutes = 1.33 strikes per minute
      expect(calculateActivityPenalty('Split Decision', stats, 15)).toBe(0.9);
    });

    it('should return 0.95 for decision with moderate low strikes', () => {
      const stats = {
        fighterA: createFighterStats({
          totalStrikesLanded: 30,
        }),
        fighterB: createFighterStats({
          totalStrikesLanded: 30,
        }),
      };

      // 60 total strikes / 15 minutes = 4 strikes per minute
      expect(calculateActivityPenalty('Majority Decision', stats, 15)).toBe(0.95);
    });

    it('should return 1.0 when no stats provided', () => {
      expect(calculateActivityPenalty('Unanimous Decision', undefined, 15)).toBe(1.0);
    });

    it('should return 1.0 when no fight time provided', () => {
      const stats = {
        fighterA: createFighterStats(),
        fighterB: createFighterStats(),
      };

      expect(calculateActivityPenalty('Unanimous Decision', stats, undefined)).toBe(1.0);
    });
  });

  describe('calculateWeightClassAdjustment', () => {
    it('should return 1.05 for Flyweight', () => {
      expect(calculateWeightClassAdjustment('Flyweight')).toBe(1.05);
      expect(calculateWeightClassAdjustment('flyweight')).toBe(1.05);
    });

    it('should return 1.05 for Bantamweight', () => {
      expect(calculateWeightClassAdjustment('Bantamweight')).toBe(1.05);
      expect(calculateWeightClassAdjustment('bantamweight')).toBe(1.05);
    });

    it('should return 0.95 for Heavyweight', () => {
      expect(calculateWeightClassAdjustment('Heavyweight')).toBe(0.95);
      expect(calculateWeightClassAdjustment('heavyweight')).toBe(0.95);
    });

    it('should return 0.95 for Light Heavyweight', () => {
      expect(calculateWeightClassAdjustment('Light Heavyweight')).toBe(0.95);
      expect(calculateWeightClassAdjustment('light heavyweight')).toBe(0.95);
    });

    it('should return 1.0 for Middleweight', () => {
      expect(calculateWeightClassAdjustment('Middleweight')).toBe(1.0);
    });

    it('should return 1.0 for Welterweight', () => {
      expect(calculateWeightClassAdjustment('Welterweight')).toBe(1.0);
    });

    it('should return 1.0 for Lightweight', () => {
      expect(calculateWeightClassAdjustment('Lightweight')).toBe(1.0);
    });

    it('should return 1.0 when no weight class provided', () => {
      expect(calculateWeightClassAdjustment(undefined)).toBe(1.0);
    });
  });

  describe('calculateTitleBonus', () => {
    it('should return 1.0 for non-title fight', () => {
      expect(calculateTitleBonus(false, 3)).toBe(1.0);
      expect(calculateTitleBonus(false, 5)).toBe(1.0);
    });

    it('should return 1.05 for title fight with 5 rounds', () => {
      expect(calculateTitleBonus(true, 5)).toBe(1.05);
    });

    it('should return 1.0 for title fight with 3 rounds (no championship round bonus)', () => {
      expect(calculateTitleBonus(true, 3)).toBe(1.0);
    });
  });

  describe('calculatePerformanceMultipliers (master)', () => {
    it('should return combined multiplier as product of all individual ones', () => {
      const performance: FightPerformanceData = {
        method: 'KO',
        rounds: 3,
        finishRound: 1,
        weightClass: 'Welterweight',
        isTitle: false,
        stats: {
          fighterA: createFighterStats({
            sigStrikesLanded: 50,
            knockdowns: 1,
          }),
          fighterB: createFighterStats({
            sigStrikesLanded: 20,
          }),
        },
      };

      const result = calculatePerformanceMultipliers('fighterA', performance);

      // Verify individual multipliers
      expect(result.finishQuality).toBe(1.4); // KO
      expect(result.roundEfficiency).toBe(1.2); // R1 finish
      expect(result.weightClassAdjustment).toBe(1.0); // Welterweight
      expect(result.titleBonus).toBe(1.0); // Not title
      expect(result.activityPenalty).toBe(1.0); // Not decision
      expect(result.domination).toBeGreaterThan(1.0); // Winner has better stats

      // Verify combined is product
      const expectedCombined =
        result.finishQuality *
        result.domination *
        result.roundEfficiency *
        result.activityPenalty *
        result.weightClassAdjustment *
        result.titleBonus;

      expect(result.combined).toBeCloseTo(expectedCombined, 5);
    });

    it('should return sensible values for draw', () => {
      const performance: FightPerformanceData = {
        method: 'Draw',
        rounds: 3,
        weightClass: 'Lightweight',
        isTitle: false,
      };

      const result = calculatePerformanceMultipliers('draw', performance);

      expect(result.finishQuality).toBe(0.5); // Draw
      expect(result.domination).toBe(1.0); // No stats
      expect(result.combined).toBeCloseTo(0.5, 2);
    });

    it('should include all multiplier properties in result', () => {
      const performance: FightPerformanceData = {
        method: 'Submission',
        rounds: 5,
        finishRound: 2,
        weightClass: 'Flyweight',
        isTitle: true,
      };

      const result = calculatePerformanceMultipliers('fighterA', performance);

      expect(result).toHaveProperty('finishQuality');
      expect(result).toHaveProperty('domination');
      expect(result).toHaveProperty('roundEfficiency');
      expect(result).toHaveProperty('activityPenalty');
      expect(result).toHaveProperty('weightClassAdjustment');
      expect(result).toHaveProperty('titleBonus');
      expect(result).toHaveProperty('combined');
    });

    it('should handle complete performance data', () => {
      const performance: FightPerformanceData = {
        method: 'TKO',
        rounds: 5,
        finishRound: 3,
        weightClass: 'Heavyweight',
        isTitle: true,
        stats: {
          fighterA: createFighterStats({
            sigStrikesLanded: 80,
            totalStrikesLanded: 100,
            knockdowns: 2,
          }),
          fighterB: createFighterStats({
            sigStrikesLanded: 40,
            totalStrikesLanded: 50,
            knockdowns: 0,
          }),
        },
      };

      const result = calculatePerformanceMultipliers('fighterA', performance);

      expect(result.finishQuality).toBe(1.25); // TKO
      expect(result.roundEfficiency).toBe(1.05); // R3 finish
      expect(result.weightClassAdjustment).toBe(0.95); // Heavyweight
      expect(result.titleBonus).toBe(1.05); // Title fight 5 rounds
      expect(result.activityPenalty).toBe(1.0); // Not decision
      expect(result.domination).toBeGreaterThan(1.0); // Dominant stats

      // Combined should be reasonable
      expect(result.combined).toBeGreaterThan(1.0);
      expect(result.combined).toBeLessThan(2.0);
    });
  });
});
