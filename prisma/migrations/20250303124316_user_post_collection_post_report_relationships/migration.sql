

-- AlterTable
ALTER TABLE "PostCollectionReport" ADD COLUMN     "authorId" TEXT;

-- AlterTable
ALTER TABLE "PostReport" ADD COLUMN     "authorId" TEXT;

-- AlterTable
ALTER TABLE "User" 
ADD COLUMN     "superRolePromotionAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserReport" ADD COLUMN     "authorId" TEXT;


-- CreateIndex
CREATE INDEX "PostCollectionReport_id_idx" ON "PostCollectionReport"("id");

-- CreateIndex
CREATE INDEX "PostReport_id_idx" ON "PostReport"("id");

-- CreateIndex
CREATE INDEX "UserReport_id_idx" ON "UserReport"("id");

-- AddForeignKey
ALTER TABLE "PostCollectionReport" ADD CONSTRAINT "PostCollectionReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
