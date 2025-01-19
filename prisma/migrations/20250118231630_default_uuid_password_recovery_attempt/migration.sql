
-- DropForeignKey
ALTER TABLE "PasswordRecoveryAttempt" DROP CONSTRAINT "PasswordRecoveryAttempt_userId_fkey";


-- AddForeignKey
ALTER TABLE "PasswordRecoveryAttempt" ADD CONSTRAINT "PasswordRecoveryAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
