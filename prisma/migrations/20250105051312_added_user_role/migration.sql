
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MODERATOR', 'USER');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
