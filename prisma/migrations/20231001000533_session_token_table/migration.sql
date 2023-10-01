/*
  Warnings:

  - You are about to drop the column `sessionIds` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_id_sessionIds_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "sessionIds";

-- CreateTable
CREATE TABLE "SessionToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SessionToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_id_idx" ON "User"("id");

-- AddForeignKey
ALTER TABLE "SessionToken" ADD CONSTRAINT "SessionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
