
-- CreateEnum
CREATE TYPE "UserAuthenticationSource" AS ENUM ('GOOGLE', 'GITHUB', 'DISCORD');


-- CreateTable
CREATE TABLE "LinkedUserAccount" (
    "id" TEXT NOT NULL,
    "platform" "UserAuthenticationSource" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "platformUsername" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "LinkedUserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LinkedUserAccount_platform_userId_key" ON "LinkedUserAccount"("platform", "userId");

-- AddForeignKey
ALTER TABLE "LinkedUserAccount" ADD CONSTRAINT "LinkedUserAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
