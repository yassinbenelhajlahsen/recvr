-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fitness_goal" TEXT,
ADD COLUMN     "height_inches" INTEGER,
ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weight_lbs" INTEGER;
