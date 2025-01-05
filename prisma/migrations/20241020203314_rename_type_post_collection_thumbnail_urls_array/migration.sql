
-- AlterTable
ALTER TABLE "PostCollection" DROP COLUMN "thumbnailImageUrl",
ADD COLUMN     "thumbnailImageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];


