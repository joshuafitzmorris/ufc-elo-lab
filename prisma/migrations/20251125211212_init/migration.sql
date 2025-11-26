-- CreateEnum
CREATE TYPE "Result" AS ENUM ('FIGHTER_A', 'FIGHTER_B', 'DRAW', 'NO_CONTEST');

-- CreateEnum
CREATE TYPE "Method" AS ENUM ('KO', 'TKO', 'SUBMISSION', 'DECISION', 'OTHER');

-- CreateTable
CREATE TABLE "Fighter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT,
    "weightClass" TEXT NOT NULL,
    "stance" TEXT,
    "reachCm" INTEGER,
    "heightCm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fighter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fight" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fighterAId" TEXT NOT NULL,
    "fighterBId" TEXT NOT NULL,
    "winnerId" TEXT,
    "result" "Result" NOT NULL,
    "method" "Method" NOT NULL,
    "rounds" INTEGER,
    "event" TEXT NOT NULL DEFAULT 'unknown',
    "weightClass" TEXT NOT NULL DEFAULT 'unknown',
    "calcRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fightUrl" TEXT,
    "time" TEXT,
    "timeFormat" TEXT,
    "referee" TEXT,
    "finishDetails" TEXT,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingSnapshot" (
    "id" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "fightId" TEXT,
    "calcRunId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "deviation" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalcRun" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalcRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FightStats" (
    "id" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "isWinner" BOOLEAN NOT NULL,
    "knockdowns" INTEGER NOT NULL,
    "sigStrikesLanded" INTEGER NOT NULL,
    "sigStrikesAttempted" INTEGER NOT NULL,
    "totalStrikesLanded" INTEGER NOT NULL,
    "totalStrikesAttempted" INTEGER NOT NULL,
    "takedownsLanded" INTEGER NOT NULL,
    "takedownsAttempted" INTEGER NOT NULL,
    "submissionAttempts" INTEGER NOT NULL,
    "reversals" INTEGER NOT NULL,
    "controlTimeSeconds" INTEGER NOT NULL,

    CONSTRAINT "FightStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrikeStats" (
    "id" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "headLanded" INTEGER NOT NULL,
    "headAttempted" INTEGER NOT NULL,
    "bodyLanded" INTEGER NOT NULL,
    "bodyAttempted" INTEGER NOT NULL,
    "legLanded" INTEGER NOT NULL,
    "legAttempted" INTEGER NOT NULL,
    "distanceLanded" INTEGER NOT NULL,
    "distanceAttempted" INTEGER NOT NULL,
    "clinchLanded" INTEGER NOT NULL,
    "clinchAttempted" INTEGER NOT NULL,
    "groundLanded" INTEGER NOT NULL,
    "groundAttempted" INTEGER NOT NULL,

    CONSTRAINT "StrikeStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fighter_name_idx" ON "Fighter"("name");

-- CreateIndex
CREATE INDEX "Fighter_weightClass_idx" ON "Fighter"("weightClass");

-- CreateIndex
CREATE INDEX "Fight_date_idx" ON "Fight"("date");

-- CreateIndex
CREATE INDEX "Fight_weightClass_idx" ON "Fight"("weightClass");

-- CreateIndex
CREATE UNIQUE INDEX "Fight_date_fighterAId_fighterBId_event_weightClass_key" ON "Fight"("date", "fighterAId", "fighterBId", "event", "weightClass");

-- CreateIndex
CREATE INDEX "RatingSnapshot_fighterId_idx" ON "RatingSnapshot"("fighterId");

-- CreateIndex
CREATE INDEX "RatingSnapshot_fightId_idx" ON "RatingSnapshot"("fightId");

-- CreateIndex
CREATE INDEX "FightStats_fighterId_idx" ON "FightStats"("fighterId");

-- CreateIndex
CREATE INDEX "FightStats_fightId_idx" ON "FightStats"("fightId");

-- CreateIndex
CREATE UNIQUE INDEX "FightStats_fightId_fighterId_key" ON "FightStats"("fightId", "fighterId");

-- CreateIndex
CREATE INDEX "StrikeStats_fighterId_idx" ON "StrikeStats"("fighterId");

-- CreateIndex
CREATE INDEX "StrikeStats_fightId_idx" ON "StrikeStats"("fightId");

-- CreateIndex
CREATE UNIQUE INDEX "StrikeStats_fightId_fighterId_key" ON "StrikeStats"("fightId", "fighterId");

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_fighterAId_fkey" FOREIGN KEY ("fighterAId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_fighterBId_fkey" FOREIGN KEY ("fighterBId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Fighter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_calcRunId_fkey" FOREIGN KEY ("calcRunId") REFERENCES "CalcRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingSnapshot" ADD CONSTRAINT "RatingSnapshot_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingSnapshot" ADD CONSTRAINT "RatingSnapshot_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingSnapshot" ADD CONSTRAINT "RatingSnapshot_calcRunId_fkey" FOREIGN KEY ("calcRunId") REFERENCES "CalcRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightStats" ADD CONSTRAINT "FightStats_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FightStats" ADD CONSTRAINT "FightStats_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrikeStats" ADD CONSTRAINT "StrikeStats_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "Fight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StrikeStats" ADD CONSTRAINT "StrikeStats_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
