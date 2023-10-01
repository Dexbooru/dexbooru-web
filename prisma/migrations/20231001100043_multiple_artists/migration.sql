/*
  Warnings:

  - You are about to drop the column `artistId` on the `Post` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_artistId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "artistId";

-- CreateTable
CREATE TABLE "_ArtistToPost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ArtistToPost_AB_unique" ON "_ArtistToPost"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtistToPost_B_index" ON "_ArtistToPost"("B");

-- AddForeignKey
ALTER TABLE "_ArtistToPost" ADD CONSTRAINT "_ArtistToPost_A_fkey" FOREIGN KEY ("A") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtistToPost" ADD CONSTRAINT "_ArtistToPost_B_fkey" FOREIGN KEY ("B") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
