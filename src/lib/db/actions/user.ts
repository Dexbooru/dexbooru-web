import type { Prisma, User } from '@prisma/client';
import prisma from '../prisma';
import type { DefaultArgs } from '@prisma/client/runtime/library';

type UserSelector = Prisma.UserSelect<DefaultArgs>;

export const PUBLIC_USER_SELECTORS: UserSelector = {
	id: true,
	username: true,
	email: true
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
	selectors?: UserSelector
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

export async function findUserById(id: string, selectors?: UserSelector): Promise<User | null> {
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
): Promise<boolean> {
	const user = await prisma.user.findFirst({
		where: {
			OR: [{ email }, { username }]
		}
	});
	if (user) return false;

	await prisma.user.create({
		data: {
			email,
			username,
			password
		}
	});

	return true;
}
