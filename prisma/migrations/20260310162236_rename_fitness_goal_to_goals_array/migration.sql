/*
  Warnings:

  - You are about to drop the column `fitness_goal` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "fitness_goal",
ADD COLUMN     "fitness_goals" TEXT[];
