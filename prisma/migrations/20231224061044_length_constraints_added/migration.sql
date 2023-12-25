/*
  Warnings:

  - You are about to alter the column `password` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "content" SET DATA TYPE VARCHAR(350);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" SET DATA TYPE VARCHAR(50);
