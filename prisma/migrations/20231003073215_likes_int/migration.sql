/*
  Warnings:

  - You are about to alter the column `likes` on the `Post` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "likes" SET DATA TYPE INTEGER;
