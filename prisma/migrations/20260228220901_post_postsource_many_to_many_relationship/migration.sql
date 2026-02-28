/*
  Warnings:

  - You are about to drop the column `postId` on the `PostSource` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sourceTitle,sourceType,characterName]` on the table `PostSource` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PostSource" DROP CONSTRAINT "PostSource_postId_fkey";

-- DropIndex
DROP INDEX "PostSource_postId_idx";

-- AlterTable
ALTER TABLE "PostSource" DROP COLUMN "postId";

-- CreateTable
CREATE TABLE "_PostToPostSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToPostSource_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PostToPostSource_B_index" ON "_PostToPostSource"("B");

-- CreateIndex
CREATE UNIQUE INDEX "PostSource_sourceTitle_sourceType_characterName_key" ON "PostSource"("sourceTitle", "sourceType", "characterName");

-- AddForeignKey
ALTER TABLE "_PostToPostSource" ADD CONSTRAINT "_PostToPostSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToPostSource" ADD CONSTRAINT "_PostToPostSource_B_fkey" FOREIGN KEY ("B") REFERENCES "PostSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
