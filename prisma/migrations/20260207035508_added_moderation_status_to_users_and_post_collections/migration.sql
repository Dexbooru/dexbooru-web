-- CreateEnum
CREATE TYPE "CollectionModerationStatus" AS ENUM ('FLAGGED', 'UNFLAGGED');

-- CreateEnum
CREATE TYPE "UserModerationStatus" AS ENUM ('FLAGGED', 'UNFLAGGED');

-- AlterTable
ALTER TABLE "PostCollection" ADD COLUMN     "moderationStatus" "CollectionModerationStatus" NOT NULL DEFAULT 'UNFLAGGED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "moderationStatus" "UserModerationStatus" NOT NULL DEFAULT 'UNFLAGGED';
