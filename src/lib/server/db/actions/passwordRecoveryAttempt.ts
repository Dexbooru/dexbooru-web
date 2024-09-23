import { generateRecoveryId } from "$lib/server/helpers/passwordRecovery";
import prisma from "../prisma";

export async function createPasswordRecoveryAttempt(userId: string, username: string, email: string, ipAddress: string) {
    const { hashed: hashedRecoveryId, original: originalRecoveryId } = await generateRecoveryId(email, username);
    await prisma.passwordRecoveryAttempt.create({
        data: {
            id: hashedRecoveryId,
            senderIpAddress: ipAddress,
            userId,
        }
    });

    return originalRecoveryId;
}