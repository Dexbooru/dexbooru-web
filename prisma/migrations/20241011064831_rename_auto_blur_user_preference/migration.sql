
-- AlterTable
ALTER TABLE "UserPreference" DROP COLUMN "autoBlurPostImages",
ADD COLUMN     "autoBlurNsfw" BOOLEAN NOT NULL DEFAULT true;
