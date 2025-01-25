
-- AlterTable
ALTER TABLE "PostReport" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "reviewStatus" SET DEFAULT 'NOT_REVIEWED';

