import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== ELO SYSTEM COMPARISON ===\n");

  // Get latest calc run
  const latestRun = await prisma.calcRun.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latestRun) {
    console.log("No calculation runs found");
    return;
  }

  console.log(`Calc Run: ${latestRun.description}`);
  console.log(`Performance Elo Enabled: ${latestRun.usePerformanceElo}\n`);

  // Get top fighters by classic Elo
  const topClassicElo = await prisma.ratingSnapshot.findMany({
    where: {
      calcRunId: latestRun.id,
      fightId: { not: null },
    },
    orderBy: { rating: "desc" },
    take: 20,
    include: {
      fighter: true,
    },
    distinct: ["fighterId"],
  });

  // Get top fighters by performance Elo
  const topPerformanceElo = await prisma.ratingSnapshot.findMany({
    where: {
      calcRunId: latestRun.id,
      fightId: { not: null },
      performanceRating: { not: null },
    },
    orderBy: { performanceRating: "desc" },
    take: 20,
    include: {
      fighter: true,
    },
    distinct: ["fighterId"],
  });

  console.log("TOP 20 FIGHTERS - CLASSIC ELO");
  console.log("Rank | Fighter                  | Classic | Performance | Diff");
  console.log("-----|--------------------------|---------|-------------|-----");

  topClassicElo.forEach((snap, idx) => {
    const perfRating = snap.performanceRating ?? snap.rating;
    const diff = perfRating - snap.rating;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;

    console.log(
      `${(idx + 1).toString().padStart(4)} | ${snap.fighter.name.padEnd(24)} | ${snap.rating.toString().padStart(7)} | ${perfRating.toString().padStart(11)} | ${diffStr.padStart(5)}`
    );
  });

  console.log("\n\nTOP 20 FIGHTERS - PERFORMANCE ELO");
  console.log("Rank | Fighter                  | Performance | Classic | Diff");
  console.log("-----|--------------------------|-------------|---------|-----");

  topPerformanceElo.forEach((snap, idx) => {
    const perfRating = snap.performanceRating ?? snap.rating;
    const diff = perfRating - snap.rating;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;

    console.log(
      `${(idx + 1).toString().padStart(4)} | ${snap.fighter.name.padEnd(24)} | ${perfRating.toString().padStart(11)} | ${snap.rating.toString().padStart(7)} | ${diffStr.padStart(5)}`
    );
  });

  // Find biggest gainers and losers
  const allSnapshots = await prisma.ratingSnapshot.findMany({
    where: {
      calcRunId: latestRun.id,
      fightId: { not: null },
      performanceRating: { not: null },
    },
    include: {
      fighter: true,
    },
    distinct: ["fighterId"],
  });

  const withDiff = allSnapshots.map((snap) => ({
    fighter: snap.fighter.name,
    classic: snap.rating,
    performance: snap.performanceRating!,
    diff: snap.performanceRating! - snap.rating,
  }));

  const biggestGainers = withDiff
    .filter((f) => f.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 10);

  const biggestLosers = withDiff
    .filter((f) => f.diff < 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 10);

  console.log("\n\nBIGGEST GAINERS (Performance > Classic)");
  console.log("Fighter                  | Classic | Performance | Gain");
  console.log("-------------------------|---------|-------------|------");
  biggestGainers.forEach((f) => {
    console.log(
      `${f.fighter.padEnd(24)} | ${f.classic.toString().padStart(7)} | ${f.performance.toString().padStart(11)} | +${f.diff}`
    );
  });

  console.log("\n\nBIGGEST LOSERS (Performance < Classic)");
  console.log("Fighter                  | Classic | Performance | Loss");
  console.log("-------------------------|---------|-------------|------");
  biggestLosers.forEach((f) => {
    console.log(
      `${f.fighter.padEnd(24)} | ${f.classic.toString().padStart(7)} | ${f.performance.toString().padStart(11)} | ${f.diff}`
    );
  });

  // Analyze a specific dominant performance
  console.log("\n\n=== EXAMPLE: Dominant Performance Analysis ===\n");

  const dominantFight = await prisma.fight.findFirst({
    where: {
      fightStats: {
        some: {
          knockdowns: { gt: 2 },
        },
      },
    },
    include: {
      fighterA: true,
      fighterB: true,
      fightStats: true,
      snapshots: {
        where: {
          calcRunId: latestRun.id,
        },
      },
    },
  });

  if (dominantFight) {
    console.log(`Event: ${dominantFight.event}`);
    console.log(`Date: ${dominantFight.date.toISOString().split("T")[0]}`);
    console.log(
      `Fighters: ${dominantFight.fighterA.name} vs ${dominantFight.fighterB.name}`
    );
    console.log(`Method: ${dominantFight.method}`);
    console.log();

    const statsA = dominantFight.fightStats.find(
      (s) => s.fighterId === dominantFight.fighterAId
    );
    const statsB = dominantFight.fightStats.find(
      (s) => s.fighterId === dominantFight.fighterBId
    );

    if (statsA && statsB) {
      console.log("Fight Stats:");
      console.log(
        `  ${dominantFight.fighterA.name}: ${statsA.knockdowns} KDs, ${statsA.sigStrikesLanded}/${statsA.sigStrikesAttempted} sig strikes, ${statsA.takedownsLanded}/${statsA.takedownsAttempted} TDs`
      );
      console.log(
        `  ${dominantFight.fighterB.name}: ${statsB.knockdowns} KDs, ${statsB.sigStrikesLanded}/${statsB.sigStrikesAttempted} sig strikes, ${statsB.takedownsLanded}/${statsB.takedownsAttempted} TDs`
      );
    }

    console.log("\nRating Changes:");
    dominantFight.snapshots.forEach((snap) => {
      const fighter =
        snap.fighterId === dominantFight.fighterAId
          ? dominantFight.fighterA
          : dominantFight.fighterB;
      const perfDiff = (snap.performanceRating ?? snap.rating) - snap.rating;
      console.log(
        `  ${fighter.name}: Classic Elo: ${snap.rating}, Performance Elo: ${snap.performanceRating ?? snap.rating} (${perfDiff > 0 ? "+" : ""}${perfDiff})`
      );
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
