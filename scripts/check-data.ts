import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const fightCount = await prisma.fight.count();
  const fightStatsCount = await prisma.fightStats.count();
  const strikeStatsCount = await prisma.strikeStats.count();
  const fighterCount = await prisma.fighter.count();

  console.log("Database Summary:");
  console.log(`  Fighters: ${fighterCount}`);
  console.log(`  Fights: ${fightCount}`);
  console.log(`  Fight Stats: ${fightStatsCount}`);
  console.log(`  Strike Stats: ${strikeStatsCount}`);

  const sampleFight = await prisma.fight.findFirst({
    include: {
      fighterA: true,
      fighterB: true,
      fightStats: true,
      strikeStats: true,
    },
    where: {
      fightStats: {
        some: {},
      },
    },
  });

  if (sampleFight) {
    console.log("\nSample Fight with Stats:");
    console.log(`  Event: ${sampleFight.event}`);
    console.log(`  Date: ${sampleFight.date.toISOString().split("T")[0]}`);
    console.log(
      `  ${sampleFight.fighterA.name} vs ${sampleFight.fighterB.name}`
    );
    console.log(`  Fight Stats Records: ${sampleFight.fightStats.length}`);
    console.log(`  Strike Stats Records: ${sampleFight.strikeStats.length}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
