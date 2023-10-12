import type { Prisma, User } from '@prisma/client';
import prisma from '../prisma';
import type { DefaultArgs } from '@prisma/client/runtime/library';

type TUserSelector = Prisma.UserSelect<DefaultArgs>;

export const PUBLIC_USER_SELECTORS: TUserSelector = {
	id: true,
	username: true,
	email: true,
	profilePictureUrl: true
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
): Promise<User | null> {
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

	return sessionToken.user;
}

export async function findUserById(id: string, selectors?: TUserSelector): Promise<User | null> {
	return await prisma.user.findUnique({
		where: {
			id
		},
		select: selectors
	});
}

export async function findUserByName(username: string): Promise<User | null> {
	return await prisma.user.findFirst({
		where: {
			username
		}
	});
}

export async function findUserByNameOrEmail(email: string, username: string): Promise<User | null> {
	return await prisma.user.findFirst({
		where: {
			OR: [{ email }, { username }]
		}
	});
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
): Promise<User | null> {
	const newUser = await prisma.user.create({
		data: {
			email,
			username,
			password,
			profilePictureUrl
		}
	});

	return newUser;
}
