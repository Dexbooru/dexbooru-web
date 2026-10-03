ALTER TABLE "ApplicationConfiguration"
ADD COLUMN "sauceNaoEnabledIndexes" INTEGER[] NOT NULL DEFAULT ARRAY[5, 6, 8, 9, 11, 12, 25, 26, 27, 28, 34, 39, 41, 44]::INTEGER[],
ADD COLUMN "sauceNaoMinimumSimilarity" DOUBLE PRECISION NOT NULL DEFAULT 70;
