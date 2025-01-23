import type { Prisma, UserAuthenticationSource } from '@prisma/client';
import prisma from '../prisma';

export const findLinkedAccountsForUser = async (userId: string, isSelf: boolean = false) => {
	const whereClause: Prisma.LinkedUserAccountWhereInput = {
		userId,
		...(!isSelf && { isPublic: true }),
	};

	return await prisma.linkedUserAccount.findMany({
		where: whereClause,
	});
};

export const createAccountLink = async (
	userId: string,
	platform: UserAuthenticationSource,
	platformUserId: string,
	platformUsername: string,
) => {
	const newAccountLink = await prisma.linkedUserAccount.create({
		data: {
			userId,
			platform,
			platformUserId,
			platformUsername,
		},
	});

	return newAccountLink;
};

export const deleteAccountLink = async (userId: string, platform: UserAuthenticationSource) => {
	const deletedAccountLink = await prisma.linkedUserAccount.deleteMany({
		where: {
			userId,
			platform,
		},
	});

	return deletedAccountLink;
};
