-- AlterTable
ALTER TABLE "RatingSnapshot" ADD COLUMN     "peakPerformanceRating" INTEGER,
ADD COLUMN     "peakRating" INTEGER;

-- CreateIndex
CREATE INDEX "RatingSnapshot_calcRunId_fighterId_idx" ON "RatingSnapshot"("calcRunId", "fighterId");

-- CreateIndex
CREATE INDEX "RatingSnapshot_calcRunId_fightId_idx" ON "RatingSnapshot"("calcRunId", "fightId");
