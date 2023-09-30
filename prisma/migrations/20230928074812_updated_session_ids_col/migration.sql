/*
  Warnings:

  - You are about to drop the column `sessionId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_id_sessionId_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "sessionId",
ADD COLUMN     "sessionIds" TEXT[];

-- CreateIndex
CREATE INDEX "User_id_sessionIds_idx" ON "User"("id", "sessionIds");
