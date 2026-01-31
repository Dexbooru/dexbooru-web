import type { Prisma } from '$generated/prisma/client';
import { RECOVERY_ATTEMPT_EXPIRY_HOURS } from '$lib/server/constants/passwordRecovery';
import prisma from '../prisma';

export async function createPasswordRecoveryAttempt(userId: string, ipAddress: string) {
	const attemptExpiresAt = new Date();
	attemptExpiresAt.setDate(attemptExpiresAt.getDate() + RECOVERY_ATTEMPT_EXPIRY_HOURS / 24);

	return await prisma.passwordRecoveryAttempt.create({
		data: {
			id: crypto.randomUUID(),
			senderIpAddress: ipAddress,
			expiresAt: attemptExpiresAt,
			userId,
		},
	});
}

export async function getPasswordRecoveryAttempt(
	id: string,
	selectors?: Prisma.PasswordRecoveryAttemptSelect,
) {
	return prisma.passwordRecoveryAttempt.findUnique({
		where: {
			id,
		},
		select: selectors,
	});
}

export async function deletePasswordRecoveryAttempt(id: string) {
	return prisma.passwordRecoveryAttempt.delete({
		where: {
			id,
		},
	});
}
