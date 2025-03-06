-- CreateEnum
CREATE TYPE "PostCollectionReportCategory" AS ENUM ('INAPPROPRIATE_TITLE', 'INAPPROPRIATE_DESCRIPTION', 'OTHER');

-- CreateEnum
CREATE TYPE "ModerationReportStatus" AS ENUM ('NOT_REVIEWED', 'IN_REVIEW', 'REJECTED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "UserReportCategory" AS ENUM ('NSFW_PROFILE_PICTURE', 'INAPPROPRIATE_USERNAME', 'OTHER');


-- AlterTable
ALTER TABLE "PostReport" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "reviewStatus",
ADD COLUMN     "reviewStatus" "ModerationReportStatus" NOT NULL DEFAULT 'NOT_REVIEWED';


-- DropEnum
DROP TYPE "PostReportReviewStatus";

-- CreateTable
CREATE TABLE "PostCollectionReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "PostCollectionReportCategory" NOT NULL,
    "description" VARCHAR(250),
    "reviewStatus" "ModerationReportStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
    "postCollectionId" TEXT,

    CONSTRAINT "PostCollectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" "UserReportCategory" NOT NULL,
    "description" VARCHAR(250),
    "reviewStatus" "ModerationReportStatus" NOT NULL DEFAULT 'NOT_REVIEWED',
    "userId" TEXT,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PostCollectionReport" ADD CONSTRAINT "PostCollectionReport_postCollectionId_fkey" FOREIGN KEY ("postCollectionId") REFERENCES "PostCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
