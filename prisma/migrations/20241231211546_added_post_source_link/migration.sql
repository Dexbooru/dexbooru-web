-- AlterTable
ALTER TABLE "Post" 
ADD COLUMN     "sourceLink" VARCHAR(450) NOT NULL;

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");
