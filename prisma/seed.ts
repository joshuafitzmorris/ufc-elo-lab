import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  ingestAndRecompute,
  ingestPayloadSchema,
  type IngestPayload,
} from "../src/lib/elo/ingest";
import { sampleFights } from "../src/lib/data/sample";

const prisma = new PrismaClient();

const defaultFightFiles = [
  "fights.json",
];

async function main() {
  console.log("Seeding UFC Elo data...");

  await prisma.ratingSnapshot.deleteMany();
  await prisma.fight.deleteMany();
  await prisma.fighter.deleteMany();
  await prisma.calcRun.deleteMany();

  const payload = await loadLocalFights();
  const summary = await ingestAndRecompute(payload, prisma);

  console.log(
    `Seed complete: ${summary.fighters} fighters, ${summary.fights} fights, ${summary.snapshots} snapshots.`
  );
}

async function loadLocalFights(): Promise<IngestPayload> {
  const fileList =
    process.env.SEED_FILES?.split(",").map((file) => file.trim()) ??
    defaultFightFiles;

  const fights: IngestPayload["fights"] = [];
  const descriptions: string[] = [];

  for (const file of fileList) {
    if (!file) continue;

    const fullPath = path.resolve(process.cwd(), file);

    try {
      const raw = await fs.readFile(fullPath, "utf8");
      const parsed = ingestPayloadSchema.parse(JSON.parse(raw));
      fights.push(...parsed.fights);
      if (parsed.description) {
        descriptions.push(parsed.description);
      }
      console.log(
        `Loaded ${parsed.fights.length} fights from ${path.basename(fullPath)}`
      );
    } catch (error) {
      console.warn(
        `Skipping ${path.basename(fullPath)}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  if (fights.length === 0) {
    console.warn(
      "No local fight files found; falling back to bundled sample fights."
    );
    return {
      description: "Sample seed",
      fights: sampleFights,
    };
  }

  return {
    description:
      descriptions.length > 0
        ? `Seed: ${descriptions.join(" / ")}`
        : "Seeded from local fight files",
    fights,
  };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
