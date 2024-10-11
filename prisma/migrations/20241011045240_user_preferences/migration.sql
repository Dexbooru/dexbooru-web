
-- CreateTable
CREATE TABLE "UserPreference" (
    "browseInSafeMode" BOOLEAN NOT NULL DEFAULT false,
    "autoBlurPostImages" BOOLEAN NOT NULL DEFAULT true,
    "blacklistedTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blacklistedArtists" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customSideWideCss" TEXT NOT NULL DEFAULT '',
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
