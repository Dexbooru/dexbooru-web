-- CreateEnum
CREATE TYPE "CustomDataMigrationStatus" AS ENUM ('PENDING', 'APPLIED', 'FAILED');

-- CreateTable
CREATE TABLE "CustomDataMigration" (
    "id" TEXT NOT NULL,
    "name" CHAR(200) NOT NULL,
    "scriptFilePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CustomDataMigrationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "CustomDataMigration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomDataMigration_name_key" ON "CustomDataMigration"("name");
