-- CreateTable
CREATE TABLE "PostCollection" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT,

    CONSTRAINT "PostCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostToPostCollection" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PostToPostCollection_AB_unique" ON "_PostToPostCollection"("A", "B");

-- CreateIndex
CREATE INDEX "_PostToPostCollection_B_index" ON "_PostToPostCollection"("B");

-- AddForeignKey
ALTER TABLE "PostCollection" ADD CONSTRAINT "PostCollection_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToPostCollection" ADD CONSTRAINT "_PostToPostCollection_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToPostCollection" ADD CONSTRAINT "_PostToPostCollection_B_fkey" FOREIGN KEY ("B") REFERENCES "PostCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
