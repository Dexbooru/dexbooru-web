-- CreateEnum
CREATE TYPE "PostSourceType" AS ENUM ('VIDEOGAME', 'ANIME', 'MANGA', 'OTHER');


-- CreateTable
CREATE TABLE "PostSource" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "sourceType" "PostSourceType" NOT NULL,
    "sourceTitle" VARCHAR(200) NOT NULL,
    "characterName" VARCHAR(200) NOT NULL,

    CONSTRAINT "PostSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostSource_id_idx" ON "PostSource"("id");

-- CreateIndex
CREATE INDEX "PostSource_postId_idx" ON "PostSource"("postId");

-- AddForeignKey
ALTER TABLE "PostSource" ADD CONSTRAINT "PostSource_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
