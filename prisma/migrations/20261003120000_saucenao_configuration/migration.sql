-- CreateTable
CREATE TABLE "SauceNaoIndex" (
    "id" INTEGER NOT NULL,
    "maskBit" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "sourceType" "PostSourceType",
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SauceNaoIndex_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ApplicationConfiguration"
ADD COLUMN "sauceNaoMinimumSimilarity" DOUBLE PRECISION NOT NULL DEFAULT 70;
