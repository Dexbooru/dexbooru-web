-- AlterTable
ALTER TABLE "Tag"
ADD COLUMN     "description" VARCHAR(200),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

