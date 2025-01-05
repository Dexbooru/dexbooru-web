-- AlterTable
ALTER TABLE "Post" 
ALTER COLUMN "description" SET DATA TYPE VARCHAR(500);

-- AlterTable
ALTER TABLE "PostCollection" DROP COLUMN "imageUrls",
ADD COLUMN     "thumbnailImageUrl" TEXT;


