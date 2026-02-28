
-- CreateIndex
CREATE INDEX "Post_moderationStatus_createdAt_idx" ON "Post"("moderationStatus", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Post_moderationStatus_likes_idx" ON "Post"("moderationStatus", "likes" DESC);

-- CreateIndex
CREATE INDEX "Post_moderationStatus_commentCount_idx" ON "Post"("moderationStatus", "commentCount" DESC);

