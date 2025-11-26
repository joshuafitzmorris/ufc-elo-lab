import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const calcRun = await prisma.calcRun.findFirst({
    where: { usePerformanceElo: true },
    orderBy: { createdAt: "desc" },
  });

  if (!calcRun) {
    console.log("No calc run found");
    return;
  }

  // Check Anderson Silva - great example of a fighter past prime
  const anderson = await prisma.fighter.findFirst({
    where: { name: "Anderson Silva" },
  });

  if (anderson) {
    console.log("=== ANDERSON SILVA PEAK TRACKING ===");
    const snapshots = await prisma.ratingSnapshot.findMany({
      where: { fighterId: anderson.id, calcRunId: calcRun.id, fightId: { not: null } },
      include: { fight: true },
      orderBy: { fight: { date: "asc" } },
    });

    console.log("Date       | Classic | Peak | Perf | Peak Perf");
    console.log("-----------|---------|------|------|----------");
    snapshots.forEach((s) => {
      const date = s.fight?.date.toISOString().split("T")[0] ?? "N/A";
      console.log(
        `${date} | ${String(s.rating).padStart(7)} | ${String(s.peakRating ?? "-").padStart(4)} | ${String(s.performanceRating ?? "-").padStart(4)} | ${String(s.peakPerformanceRating ?? "-").padStart(9)}`
      );
    });
  }

  // Top 10 by PEAK performance rating
  console.log("\n=== TOP 10 BY PEAK PERFORMANCE RATING ===");

  const fighters = await prisma.fighter.findMany();
  const peakRatings: Array<{ name: string; current: number; peak: number; currentPerf: number; peakPerf: number }> = [];

  for (const fighter of fighters.slice(0, 200)) { // Check first 200 for speed
    const latest = await prisma.ratingSnapshot.findFirst({
      where: { fighterId: fighter.id, calcRunId: calcRun.id, fightId: { not: null } },
      orderBy: { fight: { date: "desc" } },
    });

    if (latest && latest.peakPerformanceRating) {
      peakRatings.push({
        name: fighter.name,
        current: latest.rating,
        peak: latest.peakRating ?? latest.rating,
        currentPerf: latest.performanceRating ?? latest.rating,
        peakPerf: latest.peakPerformanceRating,
      });
    }
  }

  peakRatings
    .sort((a, b) => b.peakPerf - a.peakPerf)
    .slice(0, 15)
    .forEach((r, i) => {
      const dropFromPeak = r.peakPerf - r.currentPerf;
      console.log(
        `${(i + 1).toString().padStart(2)}. ${r.name.padEnd(25)} | Peak: ${r.peakPerf} | Current: ${r.currentPerf} | Drop: ${dropFromPeak > 0 ? "-" + dropFromPeak : "0"}`
      );
    });
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
