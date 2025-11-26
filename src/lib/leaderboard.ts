import { prisma } from "./prisma";

export type LeaderboardRow = {
  fighterId: string;
  name: string;
  weightClass: string;
  rating: number;
  lastFight: Date | string;
};

export async function getLeaderboardRows(): Promise<LeaderboardRow[]> {
  const calcRun = await prisma.calcRun.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!calcRun) return [];

  // Use raw SQL for efficient DISTINCT ON by fighter with latest fight date
  const query = `
    SELECT DISTINCT ON (rs."fighterId")
      rs."fighterId",
      fi.name,
      fi."weightClass",
      rs.rating,
      f.date as "lastFight"
    FROM "RatingSnapshot" rs
    INNER JOIN "Fighter" fi ON rs."fighterId" = fi.id
    INNER JOIN "Fight" f ON rs."fightId" = f.id
    WHERE rs."calcRunId" = $1
      AND rs."fightId" IS NOT NULL
    ORDER BY rs."fighterId", f.date DESC
  `;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      fighterId: string;
      name: string;
      weightClass: string;
      rating: number;
      lastFight: Date;
    }>
  >(query, calcRun.id);

  return rows
    .map((row) => ({
      fighterId: row.fighterId,
      name: row.name,
      weightClass: row.weightClass,
      rating: row.rating,
      lastFight: row.lastFight,
    }))
    .sort((a, b) => b.rating - a.rating);
}
