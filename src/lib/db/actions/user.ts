import type { Prisma, User } from '@prisma/client';
import prisma from '../prisma';
import type { DefaultArgs } from '@prisma/client/runtime/library';

type UserColumnSelectors = Prisma.UserSelect<DefaultArgs> | null;

export const PUBLIC_USER_SELECTORS: UserColumnSelectors = {
	id: true,
	username: true,
	email: true
};

export async function appendSessionIdToUser(userId: string): Promise<string> {
	const sessionId = crypto.randomUUID();
	await prisma.user.update({
		where: {
			id: userId
		},
		data: {
			sessionIds: {
				push: sessionId
			}
		}
	});
	return sessionId;
}

export async function removeSessionIdFromUser(userId: string, sessionId: string): Promise<boolean> {
	const currentUser = await findUserById(userId, { sessionIds: true });
	if (!currentUser) {
		return false;
	}

	const filteredSessionIds = currentUser.sessionIds.filter(
		(currentSessionId) => currentSessionId !== sessionId
	);

	const updatedUser = await prisma.user.update({
		where: {
			id: userId
		},
		data: {
			sessionIds: {
				set: filteredSessionIds
			}
		}
	});

	return !!updatedUser;
}

export async function findUserBySessionId(
	sessionId: string,
	selectors: UserColumnSelectors = null
): Promise<User | null> {
	return await prisma.user.findFirst({
		where: {
			sessionIds: {
				has: sessionId
			}
		},
		select: selectors
	});
}

export async function findUserById(
	id: string,
	selectors: UserColumnSelectors = null
): Promise<User | null> {
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

export async function createUser(
	username: string,
	email: string,
	password: string
): Promise<User | null> {
	const user = await prisma.user.findFirst({
		where: {
			OR: [{ email }, { username }]
		}
	});
	if (user) return null;

	const newUser = await prisma.user.create({
		data: {
			email,
			username,
			password
		}
	});

	return newUser;
}
