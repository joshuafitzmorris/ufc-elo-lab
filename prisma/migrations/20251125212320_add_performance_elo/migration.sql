-- AlterTable
ALTER TABLE "CalcRun" ADD COLUMN     "usePerformanceElo" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "RatingSnapshot" ADD COLUMN     "performanceRating" INTEGER;
