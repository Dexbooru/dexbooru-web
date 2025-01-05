
-- AlterTable
ALTER TABLE "UserPreference" DROP COLUMN "otpEnabled",
ADD COLUMN     "twoFactorAuthenticationEnabled" BOOLEAN NOT NULL DEFAULT false;
