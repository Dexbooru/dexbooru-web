import type { Prisma } from '@prisma/client';
import type { IUser } from '$lib/shared/types/users';
import prisma from '../prisma';
import type { DefaultArgs } from '@prisma/client/runtime/library';

type TUserSelector = Prisma.UserSelect<DefaultArgs>;

export const PUBLIC_USER_SELECTORS: TUserSelector = {
	id: true,
	username: true,
	email: true,
	profilePictureUrl: true,
	likedPosts: true,
	createdComments: true,
	createdPosts: true
};

export async function createSessionForUser(userId: string): Promise<string> {
	const { id } = await prisma.sessionToken.create({
		data: {
			userId
		},
		select: {
			id: true
		}
	});

	return id;
}

export async function deleteSessionFromUser(sessionId: string) {
	if (!sessionId) return;

	await prisma.sessionToken.delete({
		where: {
			id: sessionId
		}
	});
}

export async function deleteAllSessionsFromUser(userId: string) {
	await prisma.sessionToken.deleteMany({
		where: {
			id: userId
		}
	});
}

export async function findUserBySessionId(
	sessionId: string,
	selectors?: TUserSelector
): Promise<IUser | null> {
	const sessionToken = await prisma.sessionToken.findUnique({
		where: {
			id: sessionId
		},
		include: {
			user: {
				select: selectors
			}
		}
	});

	if (!sessionToken) return null;

	return sessionToken.user as IUser;
}

export async function findUserById(id: string, selectors?: TUserSelector): Promise<IUser | null> {
	return (await prisma.user.findUnique({
		where: {
			id
		},
		select: selectors
	})) as IUser;
}

export async function findUserByName(username: string): Promise<IUser | null> {
	return (await prisma.user.findFirst({
		where: {
			username
		}
	})) as IUser;
}

export async function findUserByNameOrEmail(
	email: string,
	username: string
): Promise<IUser | null> {
	return (await prisma.user.findFirst({
		where: {
			OR: [{ email }, { username }]
		}
	})) as IUser;
}

export async function editPasswordByUserId(userId: string, newPassword: string): Promise<boolean> {
	const updateUserPasswordBatchResult = await prisma.user.updateMany({
		where: {
			id: userId
		},
		data: {
			password: newPassword
		}
	});

	return updateUserPasswordBatchResult.count > 0;
}

export async function editUsernameByUserId(userId: string, newUsername: string): Promise<boolean> {
	const updateUsernameBatchResult = await prisma.user.updateMany({
		where: {
			id: userId
		},
		data: {
			username: newUsername
		}
	});

	return updateUsernameBatchResult.count > 0;
}

export async function deleteUserById(userId: string): Promise<boolean> {
	if (!userId) return false;

	const deleteUserBatchResult = await prisma.user.deleteMany({
		where: {
			id: userId
		}
	});

	return deleteUserBatchResult.count > 0;
}

export async function createUser(
	username: string,
	email: string,
	password: string,
	profilePictureUrl: string
): Promise<IUser | null> {
	const newUser = await prisma.user.create({
		data: {
			email,
			username,
			password,
			profilePictureUrl
		}
	});

	return newUser as IUser;
}
