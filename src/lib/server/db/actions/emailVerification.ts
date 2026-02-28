import type { Prisma } from '$generated/prisma/client';
import { VERIFICATION_TOKEN_EXPIRY_HOURS } from '$lib/server/constants/emailVerification';
import prisma from '../prisma';

export async function createEmailVerificationToken(userId: string) {
	const expiresAt = new Date();
	expiresAt.setHours(expiresAt.getHours() + VERIFICATION_TOKEN_EXPIRY_HOURS);

	return await prisma.emailVerificationToken.create({
		data: {
			id: crypto.randomUUID(),
			userId,
			expiresAt,
		},
	});
}

export async function getEmailVerificationToken(
	tokenId: string,
	selectors?: Prisma.EmailVerificationTokenSelect,
) {
	return prisma.emailVerificationToken.findUnique({
		where: {
			id: tokenId,
		},
		select: selectors,
	});
}

export async function deleteEmailVerificationToken(tokenId: string) {
	return prisma.emailVerificationToken.delete({
		where: {
			id: tokenId,
		},
	});
}
