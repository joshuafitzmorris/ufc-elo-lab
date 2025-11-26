import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function investigate() {
  // Find Ilia, Max, and Charles
  const ilia = await prisma.fighter.findFirst({
    where: { name: { contains: "Topuria" } },
  });
  const max = await prisma.fighter.findFirst({
    where: { name: { contains: "Holloway" } },
  });
  const charles = await prisma.fighter.findFirst({
    where: { name: { contains: "Oliveira" } },
  });

  console.log("=== FIGHTER IDs ===");
  console.log("Ilia:", ilia?.id, ilia?.name);
  console.log("Max:", max?.id, max?.name);
  console.log("Charles:", charles?.id, charles?.name);

  const calcRun = await prisma.calcRun.findFirst({
    where: { usePerformanceElo: true },
    orderBy: { createdAt: "desc" },
  });

  if (!ilia || !max || !charles || !calcRun) {
    console.log("Missing data");
    return;
  }

  // Get Ilia's fight history with ratings
  console.log("\n=== ILIA TOPURIA FIGHT HISTORY ===");
  const iliaFights = await prisma.ratingSnapshot.findMany({
    where: {
      fighterId: ilia.id,
      calcRunId: calcRun.id,
      fightId: { not: null },
    },
    include: {
      fight: {
        include: {
          fighterA: true,
          fighterB: true,
          winner: true,
        },
      },
    },
    orderBy: { fight: { date: "asc" } },
  });

  iliaFights.forEach((s) => {
    if (!s.fight) return;
    const opponent =
      s.fight.fighterAId === ilia.id
        ? s.fight.fighterB.name
        : s.fight.fighterA.name;
    const won = s.fight.winnerId === ilia.id;
    console.log(
      `${s.fight.date.toISOString().split("T")[0]} vs ${opponent.padEnd(25)} ${won ? "W" : "L"} | Classic: ${s.rating} | Perf: ${s.performanceRating} | Method: ${s.fight.method}`
    );
  });

  // Check Max and Charles latest ratings
  console.log("\n=== CURRENT RATINGS ===");

  const getLatest = async (fighterId: string, name: string) => {
    const snap = await prisma.ratingSnapshot.findFirst({
      where: { fighterId, calcRunId: calcRun.id, fightId: { not: null } },
      include: { fight: true },
      orderBy: { fight: { date: "desc" } },
    });
    const count = await prisma.ratingSnapshot.count({
      where: { fighterId, calcRunId: calcRun.id, fightId: { not: null } },
    });
    console.log(
      `${name.padEnd(20)} | Classic: ${snap?.rating} | Perf: ${snap?.performanceRating} | Fights: ${count}`
    );
  };

  await getLatest(ilia.id, "Ilia Topuria");
  await getLatest(max.id, "Max Holloway");
  await getLatest(charles.id, "Charles Oliveira");

  // Find the specific fights where Ilia beat them
  console.log("\n=== ILIA vs MAX FIGHT ===");
  const iliaVsMax = await prisma.fight.findFirst({
    where: {
      OR: [
        { fighterAId: ilia.id, fighterBId: max.id },
        { fighterAId: max.id, fighterBId: ilia.id },
      ],
    },
    include: { winner: true, fightStats: true },
  });
  if (iliaVsMax) {
    console.log(`Date: ${iliaVsMax.date.toISOString().split("T")[0]}`);
    console.log(`Winner: ${iliaVsMax.winner?.name}`);
    console.log(`Method: ${iliaVsMax.method}`);
  } else {
    console.log("No fight found");
  }

  console.log("\n=== ILIA vs CHARLES FIGHT ===");
  const iliaVsCharles = await prisma.fight.findFirst({
    where: {
      OR: [
        { fighterAId: ilia.id, fighterBId: charles.id },
        { fighterAId: charles.id, fighterBId: ilia.id },
      ],
    },
    include: { winner: true },
  });
  if (iliaVsCharles) {
    console.log(`Date: ${iliaVsCharles.date.toISOString().split("T")[0]}`);
    console.log(`Winner: ${iliaVsCharles.winner?.name}`);
    console.log(`Method: ${iliaVsCharles.method}`);
  } else {
    console.log("No fight found between Ilia and Charles");
  }

  // Get Max's fight history
  console.log("\n=== MAX HOLLOWAY RECENT FIGHTS ===");
  const maxFights = await prisma.ratingSnapshot.findMany({
    where: { fighterId: max.id, calcRunId: calcRun.id, fightId: { not: null } },
    include: {
      fight: {
        include: {
          fighterA: true,
          fighterB: true,
          winner: true,
        },
      },
    },
    orderBy: { fight: { date: "desc" } },
    take: 10,
  });

  maxFights.forEach((s) => {
    if (!s.fight) return;
    const opponent =
      s.fight.fighterAId === max.id
        ? s.fight.fighterB.name
        : s.fight.fighterA.name;
    const won = s.fight.winnerId === max.id;
    console.log(
      `${s.fight.date.toISOString().split("T")[0]} vs ${opponent.padEnd(25)} ${won ? "W" : "L"} | Classic: ${s.rating} | Perf: ${s.performanceRating}`
    );
  });
}

investigate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
