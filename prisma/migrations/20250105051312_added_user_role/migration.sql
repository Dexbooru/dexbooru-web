
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MODERATOR', 'USER');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "searchable",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER';
