-- CreateEnum
CREATE TYPE "PostReportReviewStatus" AS ENUM ('NOT_REVIEWED', 'IN_REVIEW', 'REJECTED', 'ACCEPTED');

-- CreateTable
CREATE TABLE "PostReport" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reviewStatus" "PostReportReviewStatus" NOT NULL,
    "postId" TEXT,

    CONSTRAINT "PostReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PostReport" ADD CONSTRAINT "PostReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
