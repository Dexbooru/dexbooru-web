import type { TUserSelector } from '$lib/server/types/users';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { IUser } from '$lib/shared/types/users';
import prisma from '../prisma';

export async function checkIfUsersAreFriends(
	senderUserId: string,
	receiverUserId: string,
): Promise<boolean> {
	const friendResult = await prisma.user.findUnique({
		where: {
			id: senderUserId,
			friends: {
				some: {
					id: receiverUserId,
				},
			},
		},
		select: {
			id: true,
		},
	});

	return !!friendResult;
}

export async function createFriend(senderUserId: string, receiverUserId: string): Promise<boolean> {
	const modifiedSenderUserRecord = await prisma.user.update({
		where: {
			id: senderUserId,
		},
		data: {
			friends: {
				connect: {
					id: receiverUserId,
				},
			},
		},
	});

	const modifiedReceiverUserRecord = await prisma.user.update({
		where: {
			id: receiverUserId,
		},
		data: {
			friends: {
				connect: {
					id: senderUserId,
				},
			},
		},
	});

	return !!modifiedSenderUserRecord && !!modifiedReceiverUserRecord;
}

export async function deleteFriend(senderUserId: string, receiverUserId: string): Promise<boolean> {
	const modifiedSenderUserRecord = await prisma.user.update({
		where: {
			id: senderUserId,
		},
		data: {
			friends: {
				disconnect: {
					id: receiverUserId,
				},
			},
		},
	});

	const modifiedReceiverUserRecord = await prisma.user.update({
		where: {
			id: receiverUserId,
		},
		data: {
			friends: {
				disconnect: {
					id: senderUserId,
				},
			},
		},
	});

	return !!modifiedReceiverUserRecord && !!modifiedSenderUserRecord;
}

export async function findLikedPostsFromSubset(userId: string, posts: TPost[]): Promise<TPost[]> {
	const postIds = posts.map((post) => post.id);
	const likedPostsInSubsetData = await prisma.user.findUnique({
		where: {
			id: userId,
		},
		select: {
			likedPosts: {
				where: {
					id: {
						in: postIds,
					},
				},
			},
		},
	});

	return (likedPostsInSubsetData ? likedPostsInSubsetData.likedPosts : []) as TPost[];
}

export async function findLikedPostsByAuthorId(
	pageNumber: number,
	pageLimit: number,
	authorId: string,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector,
): Promise<TPost[] | null> {
	const data = await prisma.user.findFirst({
		where: {
			id: authorId,
		},
		select: {
			likedPosts: {
				select: selectors,
				orderBy: {
					[orderBy]: ascending ? 'asc' : 'desc',
				},
				skip: pageNumber * pageLimit,
				take: pageLimit,
			},
		},
	});

	if (!data) return null;

	return data.likedPosts as TPost[];
}

export async function findUserById(id: string, selectors?: TUserSelector): Promise<IUser | null> {
	return (await prisma.user.findUnique({
		where: {
			id,
		},
		select: selectors,
	})) as IUser;
}

export async function findUserByName(
	username: string,
	selectors?: TUserSelector,
): Promise<IUser | null> {
	return (await prisma.user.findFirst({
		where: {
			username,
		},
		select: selectors,
	})) as IUser | null;
}

export async function findUserByNameOrEmail(
	email: string,
	username: string,
): Promise<IUser | null> {
	return (await prisma.user.findFirst({
		where: {
			OR: [{ email }, { username }],
		},
	})) as IUser;
}

export async function editPasswordByUserId(userId: string, newPassword: string): Promise<boolean> {
	const updateUserPasswordBatchResult = await prisma.user.updateMany({
		where: {
			id: userId,
		},
		data: {
			password: newPassword,
			updatedAt: new Date(),
		},
	});

	return updateUserPasswordBatchResult.count > 0;
}

export async function editUsernameByUserId(userId: string, newUsername: string): Promise<boolean> {
	const updateUsernameBatchResult = await prisma.user.updateMany({
		where: {
			id: userId,
		},
		data: {
			username: newUsername,
			updatedAt: new Date(),
		},
	});

	return updateUsernameBatchResult.count > 0;
}

export async function editProfilePictureByUserId(
	userId: string,
	newProfilePictureUrl: string,
): Promise<boolean> {
	const updatedProfilePictureBatchResult = await prisma.user.updateMany({
		where: {
			id: userId,
		},
		data: {
			profilePictureUrl: newProfilePictureUrl,
			updatedAt: new Date(),
		},
	});

	return updatedProfilePictureBatchResult.count > 0;
}

export async function deleteUserById(userId: string): Promise<boolean> {
	if (!userId) return false;

	const deleteUserBatchResult = await prisma.user.deleteMany({
		where: {
			id: userId,
		},
	});

	return deleteUserBatchResult.count > 0;
}

export async function createUser(
	username: string,
	email: string,
	password: string,
	profilePictureUrl: string,
): Promise<IUser> {
	const newUser = await prisma.user.create({
		data: {
			email,
			username,
			password,
			profilePictureUrl,
		},
	});

	return newUser;
}
