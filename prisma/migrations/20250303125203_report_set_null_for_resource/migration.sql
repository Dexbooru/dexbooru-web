-- DropForeignKey
ALTER TABLE "PostCollectionReport" DROP CONSTRAINT "PostCollectionReport_postCollectionId_fkey";

-- DropForeignKey
ALTER TABLE "UserReport" DROP CONSTRAINT "UserReport_userId_fkey";

-- DropForeignKey
ALTER TABLE "PostReport" DROP CONSTRAINT "PostReport_postId_fkey";

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCollectionReport" ADD CONSTRAINT "PostCollectionReport_postCollectionId_fkey" FOREIGN KEY ("postCollectionId") REFERENCES "PostCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
