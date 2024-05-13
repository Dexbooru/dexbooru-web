/*
  Warnings:

  - You are about to drop the column `searchable` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `searchable` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `searchable` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `searchable` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "artist_searchable_idx";

-- DropIndex
DROP INDEX "post_searchable_idx";

-- DropIndex
DROP INDEX "tag_searchable_idx";

-- DropIndex
DROP INDEX "user_searchable_idx";

-- AlterTable
ALTER TABLE "Artist" DROP COLUMN "searchable";

-- AlterTable
ALTER TABLE "Comment" ALTER COLUMN "content" SET DATA TYPE VARCHAR(1500);

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "searchable";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "searchable";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "searchable";
