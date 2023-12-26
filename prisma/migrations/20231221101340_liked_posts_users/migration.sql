-- CreateTable
CREATE TABLE "_liked posts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_liked posts_AB_unique" ON "_liked posts"("A", "B");

-- CreateIndex
CREATE INDEX "_liked posts_B_index" ON "_liked posts"("B");

-- AddForeignKey
ALTER TABLE "_liked posts" ADD CONSTRAINT "_liked posts_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_liked posts" ADD CONSTRAINT "_liked posts_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
