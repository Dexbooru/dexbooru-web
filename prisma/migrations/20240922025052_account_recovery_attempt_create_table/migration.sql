-- CreateTable
CREATE TABLE "PasswordRecoveryAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderIpAddress" VARCHAR(15) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "PasswordRecoveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordRecoveryAttempt_id_idx" ON "PasswordRecoveryAttempt"("id");

-- AddForeignKey
ALTER TABLE "PasswordRecoveryAttempt" ADD CONSTRAINT "PasswordRecoveryAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
