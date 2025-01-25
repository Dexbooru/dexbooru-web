import type { Prisma, UserAuthenticationSource } from '@prisma/client';
import prisma from '../prisma';

export const updateLinkedAccountsForUserFromId = async (
	userId: string,
	deletionPlatforms: UserAuthenticationSource[],
	accountPlatformPublicities: Partial<Record<UserAuthenticationSource, boolean | undefined>>,
) => {
	if (deletionPlatforms.length > 0) {
		const deletionBatch = await prisma.linkedUserAccount.deleteMany({
			where: {
				userId,
				platform: {
					in: deletionPlatforms,
				},
			},
		});
		if (deletionBatch.count !== deletionPlatforms.length) {
			throw new Error(
				`Failed to delete the specified linked account platforms for the user with the id: ${userId} under: ${deletionPlatforms.join(', ')}`,
			);
		}
	}

	const possibleUpdationPlatforms = Object.keys(accountPlatformPublicities).filter(
		(platform) => !deletionPlatforms.includes(platform as UserAuthenticationSource),
	) as UserAuthenticationSource[];

	const updatePromises = possibleUpdationPlatforms.map((platform) =>
		prisma.linkedUserAccount.update({
			where: {
				platform_userId: {
					platform,
					userId,
				},
			},
			data: {
				isPublic: accountPlatformPublicities[platform] ?? false,
			},
		}),
	);
	const updatedLinkedAccounts = await Promise.all(updatePromises);

	return updatedLinkedAccounts;
};

export const findUserFromPlatformNameAndId = async (
	platformName: UserAuthenticationSource,
	platformUserId: string,
) => {
	const data = await prisma.linkedUserAccount.findFirst({
		relationLoadStrategy: 'join',
		where: {
			platform: platformName,
			platformUserId,
		},
		select: {
			user: {
				select: {
					id: true,
					email: true,
					username: true,
				},
			},
		},
	});

	return data?.user ?? null;
};

export const findLinkedAccountsFromUserId = async (userId: string, isSelf: boolean = false) => {
	const whereClause: Prisma.LinkedUserAccountWhereInput = {
		userId,
		...(!isSelf && { isPublic: true }),
	};

	return await prisma.linkedUserAccount.findMany({
		where: whereClause,
	});
};

export const upsertAccountLink = async (
	userId: string,
	platform: UserAuthenticationSource,
	platformUserId: string,
	platformUsername: string,
) => {
	const newAccountLink = await prisma.linkedUserAccount.upsert({
		where: {
			platform_userId: {
				platform,
				userId,
			},
		},
		update: {
			platformUserId,
			platformUsername,
		},
		create: {
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
