
-- AlterTable
ALTER TABLE "PostCollection" ADD COLUMN     "description" VARCHAR(250) NOT NULL,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "title" VARCHAR(150) NOT NULL;

-- CreateIndex
CREATE INDEX "PostCollection_id_idx" ON "PostCollection"("id");

-- CreateIndex
CREATE INDEX "PostCollection_authorId_idx" ON "PostCollection"("authorId");
