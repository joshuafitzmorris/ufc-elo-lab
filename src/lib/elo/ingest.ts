import { PrismaClient, Result } from "@prisma/client";
import { z } from "zod";
import {
  applyFight,
  simulateFight,
  type EloConfig,
  type FightInput,
} from "./engine";
import {
  applyPerformanceFight,
  simulatePerformanceFight,
  convertFightStatsToPerformanceData,
  type PerformanceEloConfig,
} from "./performanceEngine";
import type { FightPerformanceData } from "./performanceMultipliers";
import { getWinnerId, toMethod, toResult } from "./prismaAdapters";
import { prisma as defaultPrisma } from "../prisma";

const strikeStatsSchema = z.object({
  landed: z.number().int().nonnegative(),
  attempted: z.number().int().nonnegative(),
});

const fighterTotalsSchema = z.object({
  kd: z.number().int().nonnegative(),
  sigStr: strikeStatsSchema,
  sigStrPct: z.number().nullable().optional(),
  totalStr: strikeStatsSchema,
  td: strikeStatsSchema,
  tdPct: z.number().nullable().optional(),
  subAtt: z.number().int().nonnegative(),
  rev: z.number().int().nonnegative(),
  ctrl: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
});

const significantStrikesSchema = z.object({
  sigStr: strikeStatsSchema,
  sigStrPct: z.number().nullable().optional(),
  head: strikeStatsSchema,
  body: strikeStatsSchema,
  leg: strikeStatsSchema,
  distance: strikeStatsSchema,
  clinch: strikeStatsSchema,
  ground: strikeStatsSchema,
});

const fightDetailSchema = z.object({
  method: z.string().optional(),
  round: z.number().int().optional(),
  time: z.string().optional(),
  timeFormat: z.string().optional(),
  referee: z.string().optional(),
  finishDetails: z.string().optional(),
  totals: z.object({
    fighterA: fighterTotalsSchema,
    fighterB: fighterTotalsSchema,
  }).optional(),
  significantStrikes: z.object({
    fighterA: significantStrikesSchema,
    fighterB: significantStrikesSchema,
  }).optional(),
  chartPercents: z.any().optional(),
});

export const fightSchema = z.object({
  date: z.string(),
  fighterA: z.string().min(1),
  fighterB: z.string().min(1),
  winner: z.enum(["fighterA", "fighterB", "draw", "no-contest"]),
  method: z.string().optional().nullable(),
  weightClass: z.string().optional().nullable(),
  rounds: z.number().int().positive().optional().nullable(),
  event: z.string().optional().nullable(),
  fightUrl: z.string().optional(),
  time: z.string().optional(),
  stats: z.object({
    fighterA: z.object({
      kd: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
      strikes: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
      takedowns: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
      submissions: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
    }),
    fighterB: z.object({
      kd: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
      strikes: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
      takedowns: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
      submissions: z.number().int().nonnegative().nullable().default(0).transform(v => v ?? 0),
    }),
  }).optional(),
  detail: fightDetailSchema.optional(),
});

export const configSchema = z.object({
  baseRating: z.number().int().optional(),
  baseK: z.number().int().optional(),
  minK: z.number().int().optional(),
  upsetBonusPct: z.number().optional(),
  drawDelta: z.number().optional(),
});

export const ingestPayloadSchema = z.object({
  description: z.string().optional(),
  config: configSchema.optional(),
  fights: z.array(fightSchema).min(1),
});

export type IngestPayload = z.infer<typeof ingestPayloadSchema>;

export const defaultConfig: EloConfig = {
  baseRating: 1500,
  baseK: 24,
  minK: 12,
  upsetBonusPct: 12,
};

type PrismaLike = PrismaClient;

export async function ingestAndRecompute(
  payload: IngestPayload,
  client: PrismaLike = defaultPrisma
) {
  const config: EloConfig = { ...defaultConfig, ...(payload.config ?? {}) };
  const fights = [...payload.fights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  await upsertFights(fights, client);
  return recompute(config, payload.description ?? "Manual ingest", client);
}

async function upsertFights(
  fights: Array<z.infer<typeof fightSchema>>,
  client: PrismaLike
) {
  const fighterCache = new Map<string, { id: string; weightClass: string }>();

  for (const fight of fights) {
    const weightClass = normalizeWeightClass(fight.weightClass);
    const fighterA = await ensureFighter(
      fight.fighterA,
      fighterCache,
      client,
      weightClass
    );
    const fighterB = await ensureFighter(
      fight.fighterB,
      fighterCache,
      client,
      weightClass
    );

    const event = fight.event?.trim() ? fight.event.trim() : "unknown";

    const fightRecord = await client.fight.upsert({
      where: {
        fight_unique: {
          date: new Date(fight.date),
          fighterAId: fighterA.id,
          fighterBId: fighterB.id,
          event,
          weightClass,
        },
      },
      update: {
        winnerId: getWinnerId(fight.winner, fighterA.id, fighterB.id),
        result: toResult(fight.winner),
        method: toMethod(fight.method),
        rounds: fight.rounds ?? null,
        fightUrl: fight.fightUrl ?? null,
        time: fight.time ?? null,
        timeFormat: fight.detail?.timeFormat ?? null,
        referee: fight.detail?.referee ?? null,
        finishDetails: fight.detail?.finishDetails ?? null,
      },
      create: {
        date: new Date(fight.date),
        fighterAId: fighterA.id,
        fighterBId: fighterB.id,
        winnerId: getWinnerId(fight.winner, fighterA.id, fighterB.id),
        result: toResult(fight.winner),
        method: toMethod(fight.method),
        rounds: fight.rounds ?? null,
        event,
        weightClass,
        calcRunId: null,
        fightUrl: fight.fightUrl ?? null,
        time: fight.time ?? null,
        timeFormat: fight.detail?.timeFormat ?? null,
        referee: fight.detail?.referee ?? null,
        finishDetails: fight.detail?.finishDetails ?? null,
      },
    });

    if (fight.detail?.totals && fight.detail?.significantStrikes) {
      const winnerId = getWinnerId(fight.winner, fighterA.id, fighterB.id);

      await client.fightStats.upsert({
        where: { fightId_fighterId: { fightId: fightRecord.id, fighterId: fighterA.id } },
        update: {
          isWinner: winnerId === fighterA.id,
          knockdowns: fight.detail.totals.fighterA.kd,
          sigStrikesLanded: fight.detail.totals.fighterA.sigStr.landed,
          sigStrikesAttempted: fight.detail.totals.fighterA.sigStr.attempted,
          totalStrikesLanded: fight.detail.totals.fighterA.totalStr.landed,
          totalStrikesAttempted: fight.detail.totals.fighterA.totalStr.attempted,
          takedownsLanded: fight.detail.totals.fighterA.td.landed,
          takedownsAttempted: fight.detail.totals.fighterA.td.attempted,
          submissionAttempts: fight.detail.totals.fighterA.subAtt,
          reversals: fight.detail.totals.fighterA.rev,
          controlTimeSeconds: fight.detail.totals.fighterA.ctrl,
        },
        create: {
          fightId: fightRecord.id,
          fighterId: fighterA.id,
          isWinner: winnerId === fighterA.id,
          knockdowns: fight.detail.totals.fighterA.kd,
          sigStrikesLanded: fight.detail.totals.fighterA.sigStr.landed,
          sigStrikesAttempted: fight.detail.totals.fighterA.sigStr.attempted,
          totalStrikesLanded: fight.detail.totals.fighterA.totalStr.landed,
          totalStrikesAttempted: fight.detail.totals.fighterA.totalStr.attempted,
          takedownsLanded: fight.detail.totals.fighterA.td.landed,
          takedownsAttempted: fight.detail.totals.fighterA.td.attempted,
          submissionAttempts: fight.detail.totals.fighterA.subAtt,
          reversals: fight.detail.totals.fighterA.rev,
          controlTimeSeconds: fight.detail.totals.fighterA.ctrl,
        },
      });

      await client.fightStats.upsert({
        where: { fightId_fighterId: { fightId: fightRecord.id, fighterId: fighterB.id } },
        update: {
          isWinner: winnerId === fighterB.id,
          knockdowns: fight.detail.totals.fighterB.kd,
          sigStrikesLanded: fight.detail.totals.fighterB.sigStr.landed,
          sigStrikesAttempted: fight.detail.totals.fighterB.sigStr.attempted,
          totalStrikesLanded: fight.detail.totals.fighterB.totalStr.landed,
          totalStrikesAttempted: fight.detail.totals.fighterB.totalStr.attempted,
          takedownsLanded: fight.detail.totals.fighterB.td.landed,
          takedownsAttempted: fight.detail.totals.fighterB.td.attempted,
          submissionAttempts: fight.detail.totals.fighterB.subAtt,
          reversals: fight.detail.totals.fighterB.rev,
          controlTimeSeconds: fight.detail.totals.fighterB.ctrl,
        },
        create: {
          fightId: fightRecord.id,
          fighterId: fighterB.id,
          isWinner: winnerId === fighterB.id,
          knockdowns: fight.detail.totals.fighterB.kd,
          sigStrikesLanded: fight.detail.totals.fighterB.sigStr.landed,
          sigStrikesAttempted: fight.detail.totals.fighterB.sigStr.attempted,
          totalStrikesLanded: fight.detail.totals.fighterB.totalStr.landed,
          totalStrikesAttempted: fight.detail.totals.fighterB.totalStr.attempted,
          takedownsLanded: fight.detail.totals.fighterB.td.landed,
          takedownsAttempted: fight.detail.totals.fighterB.td.attempted,
          submissionAttempts: fight.detail.totals.fighterB.subAtt,
          reversals: fight.detail.totals.fighterB.rev,
          controlTimeSeconds: fight.detail.totals.fighterB.ctrl,
        },
      });

      await client.strikeStats.upsert({
        where: { fightId_fighterId: { fightId: fightRecord.id, fighterId: fighterA.id } },
        update: {
          headLanded: fight.detail.significantStrikes.fighterA.head.landed,
          headAttempted: fight.detail.significantStrikes.fighterA.head.attempted,
          bodyLanded: fight.detail.significantStrikes.fighterA.body.landed,
          bodyAttempted: fight.detail.significantStrikes.fighterA.body.attempted,
          legLanded: fight.detail.significantStrikes.fighterA.leg.landed,
          legAttempted: fight.detail.significantStrikes.fighterA.leg.attempted,
          distanceLanded: fight.detail.significantStrikes.fighterA.distance.landed,
          distanceAttempted: fight.detail.significantStrikes.fighterA.distance.attempted,
          clinchLanded: fight.detail.significantStrikes.fighterA.clinch.landed,
          clinchAttempted: fight.detail.significantStrikes.fighterA.clinch.attempted,
          groundLanded: fight.detail.significantStrikes.fighterA.ground.landed,
          groundAttempted: fight.detail.significantStrikes.fighterA.ground.attempted,
        },
        create: {
          fightId: fightRecord.id,
          fighterId: fighterA.id,
          headLanded: fight.detail.significantStrikes.fighterA.head.landed,
          headAttempted: fight.detail.significantStrikes.fighterA.head.attempted,
          bodyLanded: fight.detail.significantStrikes.fighterA.body.landed,
          bodyAttempted: fight.detail.significantStrikes.fighterA.body.attempted,
          legLanded: fight.detail.significantStrikes.fighterA.leg.landed,
          legAttempted: fight.detail.significantStrikes.fighterA.leg.attempted,
          distanceLanded: fight.detail.significantStrikes.fighterA.distance.landed,
          distanceAttempted: fight.detail.significantStrikes.fighterA.distance.attempted,
          clinchLanded: fight.detail.significantStrikes.fighterA.clinch.landed,
          clinchAttempted: fight.detail.significantStrikes.fighterA.clinch.attempted,
          groundLanded: fight.detail.significantStrikes.fighterA.ground.landed,
          groundAttempted: fight.detail.significantStrikes.fighterA.ground.attempted,
        },
      });

      await client.strikeStats.upsert({
        where: { fightId_fighterId: { fightId: fightRecord.id, fighterId: fighterB.id } },
        update: {
          headLanded: fight.detail.significantStrikes.fighterB.head.landed,
          headAttempted: fight.detail.significantStrikes.fighterB.head.attempted,
          bodyLanded: fight.detail.significantStrikes.fighterB.body.landed,
          bodyAttempted: fight.detail.significantStrikes.fighterB.body.attempted,
          legLanded: fight.detail.significantStrikes.fighterB.leg.landed,
          legAttempted: fight.detail.significantStrikes.fighterB.leg.attempted,
          distanceLanded: fight.detail.significantStrikes.fighterB.distance.landed,
          distanceAttempted: fight.detail.significantStrikes.fighterB.distance.attempted,
          clinchLanded: fight.detail.significantStrikes.fighterB.clinch.landed,
          clinchAttempted: fight.detail.significantStrikes.fighterB.clinch.attempted,
          groundLanded: fight.detail.significantStrikes.fighterB.ground.landed,
          groundAttempted: fight.detail.significantStrikes.fighterB.ground.attempted,
        },
        create: {
          fightId: fightRecord.id,
          fighterId: fighterB.id,
          headLanded: fight.detail.significantStrikes.fighterB.head.landed,
          headAttempted: fight.detail.significantStrikes.fighterB.head.attempted,
          bodyLanded: fight.detail.significantStrikes.fighterB.body.landed,
          bodyAttempted: fight.detail.significantStrikes.fighterB.body.attempted,
          legLanded: fight.detail.significantStrikes.fighterB.leg.landed,
          legAttempted: fight.detail.significantStrikes.fighterB.leg.attempted,
          distanceLanded: fight.detail.significantStrikes.fighterB.distance.landed,
          distanceAttempted: fight.detail.significantStrikes.fighterB.distance.attempted,
          clinchLanded: fight.detail.significantStrikes.fighterB.clinch.landed,
          clinchAttempted: fight.detail.significantStrikes.fighterB.clinch.attempted,
          groundLanded: fight.detail.significantStrikes.fighterB.ground.landed,
          groundAttempted: fight.detail.significantStrikes.fighterB.ground.attempted,
        },
      });
    }
  }
}

async function ensureFighter(
  name: string,
  cache: Map<string, { id: string; weightClass: string }>,
  client: PrismaLike,
  weightClass: string
) {
  const cached = cache.get(name);
  if (cached) return cached;

  const existing = await client.fighter.findFirst({
    where: { name },
    select: { id: true, weightClass: true },
  });

  if (existing) {
    if (existing.weightClass === "unknown" && weightClass !== "unknown") {
      const updated = await client.fighter.update({
        where: { id: existing.id },
        data: { weightClass },
        select: { id: true, weightClass: true },
      });
      cache.set(name, updated);
      return updated;
    }

    cache.set(name, existing);
    return existing;
  }

  const fighter = await client.fighter.create({
    data: {
      name,
      weightClass,
    },
    select: { id: true, weightClass: true },
  });

  cache.set(name, fighter);
  return fighter;
}

async function recompute(
  config: EloConfig,
  description: string,
  client: PrismaLike,
  usePerformanceElo: boolean = true
) {
  const calcRun = await client.calcRun.create({
    data: { description, usePerformanceElo },
  });

  const fighters = await client.fighter.findMany({
    select: { id: true, name: true },
  });

  const initialSnapshots = fighters.map((f) => ({
    fighterId: f.id,
    fightId: null,
    calcRunId: calcRun.id,
    rating: config.baseRating,
    performanceRating: config.baseRating,
    note: "Initial rating",
  }));

  let ratings: Record<string, number> = {};
  let performanceRatings: Record<string, number> = {};
  const peakRatings: Record<string, number> = {};
  const peakPerformanceRatings: Record<string, number> = {};

  const snapshots: {
    fighterId: string;
    fightId: string;
    calcRunId: string;
    rating: number;
    performanceRating: number;
    peakRating: number;
    peakPerformanceRating: number;
    note?: string;
  }[] = [];

  const fights = await client.fight.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      fighterA: true,
      fighterB: true,
      fightStats: true,
    },
  });

  const performanceConfig: PerformanceEloConfig = {
    ...config,
    usePerformanceMultipliers: usePerformanceElo,
  };

  for (const fight of fights) {
    const fightInput: FightInput = {
      date: fight.date.toISOString(),
      fighterA: fight.fighterA.name,
      fighterB: fight.fighterB.name,
      winner: toWinnerString(fight.result),
      method: fight.method,
      weightClass: fight.weightClass,
      rounds: fight.rounds ?? undefined,
      event: fight.event ?? undefined,
    };

    // Classic Elo
    const sim = simulateFight(fightInput, ratings, config);
    ratings = applyFight(fightInput, ratings, config);

    // Performance Elo
    let performanceData: FightPerformanceData | undefined;
    if (usePerformanceElo && fight.fightStats.length === 2) {
      const stats = convertFightStatsToPerformanceData(
        fight.fightStats,
        fight.fighterAId,
        fight.fighterBId
      );

      if (stats) {
        performanceData = {
          method: fight.method,
          rounds: fight.rounds ?? 3,
          finishRound: fight.rounds ?? undefined,
          weightClass: fight.weightClass,
          isTitle: fight.rounds === 5,
          stats,
        };
      }
    }

    const perfSim = simulatePerformanceFight(
      fightInput,
      performanceRatings,
      performanceConfig,
      performanceData
    );
    performanceRatings = applyPerformanceFight(
      fightInput,
      performanceRatings,
      performanceConfig,
      performanceData
    );

    // Calculate new ratings
    const newRatingA = Math.round(sim.nextRatings.fighterA);
    const newRatingB = Math.round(sim.nextRatings.fighterB);
    const newPerfRatingA = Math.round(perfSim.nextRatings.fighterA);
    const newPerfRatingB = Math.round(perfSim.nextRatings.fighterB);

    // Update peak ratings
    peakRatings[fight.fighterAId] = Math.max(
      peakRatings[fight.fighterAId] ?? config.baseRating,
      newRatingA
    );
    peakRatings[fight.fighterBId] = Math.max(
      peakRatings[fight.fighterBId] ?? config.baseRating,
      newRatingB
    );
    peakPerformanceRatings[fight.fighterAId] = Math.max(
      peakPerformanceRatings[fight.fighterAId] ?? config.baseRating,
      newPerfRatingA
    );
    peakPerformanceRatings[fight.fighterBId] = Math.max(
      peakPerformanceRatings[fight.fighterBId] ?? config.baseRating,
      newPerfRatingB
    );

    snapshots.push(
      {
        fighterId: fight.fighterAId,
        fightId: fight.id,
        calcRunId: calcRun.id,
        rating: newRatingA,
        performanceRating: newPerfRatingA,
        peakRating: peakRatings[fight.fighterAId],
        peakPerformanceRating: peakPerformanceRatings[fight.fighterAId],
      },
      {
        fighterId: fight.fighterBId,
        fightId: fight.id,
        calcRunId: calcRun.id,
        rating: newRatingB,
        performanceRating: newPerfRatingB,
        peakRating: peakRatings[fight.fighterBId],
        peakPerformanceRating: peakPerformanceRatings[fight.fighterBId],
      }
    );
  }

  if (initialSnapshots.length > 0) {
    await client.ratingSnapshot.createMany({ data: initialSnapshots });
  }
  if (snapshots.length > 0) {
    await client.ratingSnapshot.createMany({ data: snapshots });
  }

  return {
    calcRunId: calcRun.id,
    fighters: fighters.length,
    fights: fights.length,
    snapshots: snapshots.length + initialSnapshots.length,
  };
}

function normalizeWeightClass(weightClass?: string | null) {
  if (!weightClass) return "unknown";
  const normalized = weightClass.trim().toLowerCase();
  return normalized.length > 0 ? normalized : "unknown";
}

function toWinnerString(result: Result) {
  switch (result) {
    case Result.FIGHTER_A:
      return "fighterA";
    case Result.FIGHTER_B:
      return "fighterB";
    case Result.DRAW:
      return "draw";
    default:
      return "no-contest";
  }
}
