/*
  Warnings:

  - You are about to drop the `SessionToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SessionToken" DROP CONSTRAINT "SessionToken_userId_fkey";

-- DropTable
DROP TABLE "SessionToken";
