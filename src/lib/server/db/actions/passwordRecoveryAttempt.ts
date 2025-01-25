import type { Prisma } from '@prisma/client';
import prisma from '../prisma';

export async function createPasswordRecoveryAttempt(userId: string, ipAddress: string) {
	return await prisma.passwordRecoveryAttempt.create({
		data: {
			id: crypto.randomUUID(),
			senderIpAddress: ipAddress,
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
