/*
  Warnings:

  - You are about to alter the column `name` on the `Artist` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(40)`.
  - You are about to alter the column `name` on the `Tag` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(40)`.

*/
-- AlterTable
ALTER TABLE "Artist" ALTER COLUMN "name" SET DATA TYPE VARCHAR(75);

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "name" SET DATA TYPE VARCHAR(75);
