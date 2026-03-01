/*
  Warnings:

  - You are about to drop the column `postId` on the `PostSource` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sourceTitle,sourceType,characterName]` on the table `PostSource` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "PostSource" DROP CONSTRAINT IF EXISTS "PostSource_postId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "PostSource_postId_idx";

-- AlterTable
ALTER TABLE "PostSource" DROP COLUMN IF EXISTS "postId";

-- CreateTable
CREATE TABLE IF NOT EXISTS "_PostToPostSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToPostSource_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_PostToPostSource_B_index" ON "_PostToPostSource"("B");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PostSource_sourceTitle_sourceType_characterName_key" ON "PostSource"("sourceTitle", "sourceType", "characterName");

-- AddForeignKey (only if constraint doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_PostToPostSource_A_fkey') THEN
    ALTER TABLE "_PostToPostSource" ADD CONSTRAINT "_PostToPostSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_PostToPostSource_B_fkey') THEN
    ALTER TABLE "_PostToPostSource" ADD CONSTRAINT "_PostToPostSource_B_fkey" FOREIGN KEY ("B") REFERENCES "PostSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
