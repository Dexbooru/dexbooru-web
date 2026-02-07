import type { UserModerationStatus, UserRole } from '$generated/prisma/client';
import { roundNumber } from '$lib/client/helpers/posts';
import type { TUserSelector } from '$lib/server/types/users';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { TUser } from '$lib/shared/types/users';
import prisma from '../prisma';

export async function findAllModerators() {
	return (await prisma.user.findMany({
		where: {
			role: {
				in: ['MODERATOR', 'OWNER'],
			},
		},
		select: {
			id: true,
			username: true,
			profilePictureUrl: true,
			role: true,
			superRolePromotionAt: true,
		},
	})) as TUser[];
}

export async function updateUserRoleById(id: string, newRole: UserRole) {
	const superRolePromotionAt = ['OWNER', 'MODERATOR'].includes(newRole) ? new Date() : null;

	const updatedUser = await prisma.user.update({
		where: {
			id,
		},
		data: {
			role: newRole,
			superRolePromotionAt,
		},
	});

	return updatedUser;
}

export async function updateUserRoleByUsername(username: string, newRole: UserRole) {
	const superRolePromotionAt = ['OWNER', 'MODERATOR'].includes(newRole) ? new Date() : null;

	const updatedUser = await prisma.user.update({
		where: {
			username,
		},
		data: {
			role: newRole,
			superRolePromotionAt,
		},
	});

	return updatedUser;
}

export async function getUserStatistics(userId: string) {
	const totalPostsPromise = prisma.post.count({
		where: { authorId: userId },
	});

	const totalCommentsPromise = prisma.comment.count({
		where: { authorId: userId },
	});

	const postAggregatesPromise = prisma.post.aggregate({
		where: { authorId: userId },
		_sum: {
			likes: true,
			views: true,
		},
		_avg: {
			likes: true,
			views: true,
		},
	});

	const [totalPosts, totalComments, postAggregates] = await Promise.all([
		totalPostsPromise,
		totalCommentsPromise,
		postAggregatesPromise,
	]);

	return {
		totalPosts,
		totalComments,
		totalLikes: roundNumber(postAggregates._sum.likes ?? 0, 2),
		averageLikes: roundNumber(postAggregates._avg.likes ?? 0, 2),
		totalViews: roundNumber(postAggregates._sum.views ?? 0, 2),
		averageViews: roundNumber(postAggregates._avg.views ?? 0, 2),
	};
}

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
): Promise<TPost[]> {
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

	if (!data) return [];

	return data.likedPosts as TPost[];
}

export async function findUserById(id: string, selectors?: TUserSelector): Promise<TUser | null> {
	return (await prisma.user.findUnique({
		where: {
			id,
		},
		select: selectors,
	})) as TUser;
}

export async function findUserByEmail(
	email: string,
	selectors?: TUserSelector,
): Promise<TUser | null> {
	return (await prisma.user.findFirst({
		where: {
			email,
		},
		select: selectors,
	})) as TUser | null;
}

export async function findUserByName(
	username: string,
	selectors?: TUserSelector,
): Promise<TUser | null> {
	return (await prisma.user.findFirst({
		where: {
			username,
		},
		select: selectors,
	})) as TUser | null;
}

export async function findUserByNameOrEmail(
	email: string,
	username: string,
): Promise<TUser | null> {
	return (await prisma.user.findFirst({
		where: {
			OR: [{ email }, { username }],
		},
	})) as TUser | null;
}

export async function updatePasswordByUserId(
	userId: string,
	newPassword: string,
): Promise<boolean> {
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

export async function updateUsernameByUserId(
	userId: string,
	newUsername: string,
): Promise<boolean> {
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

export async function updateProfilePictureByUserId(
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

export async function updateUserModerationStatus(userId: string, status: UserModerationStatus) {
	return await prisma.user.update({
		where: {
			id: userId,
		},
		data: {
			moderationStatus: status,
			updatedAt: new Date(),
		},
	});
}

export async function createUser(
	username: string,
	email: string,
	password: string,
	profilePictureUrl: string,
): Promise<TUser> {
	const newUser = await prisma.user.create({
		data: {
			email,
			username,
			password,
			profilePictureUrl,
		},
	});

	return newUser as TUser;
}

export async function findUserSelf(userId: string) {
	const user = await prisma.user.findUnique({
		select: {
			id: true,
			profilePictureUrl: true,
			username: true,
			email: true,
			role: true,
			createdAt: true,
			updatedAt: true,
			preferences: {
				select: {
					autoBlurNsfw: true,
					twoFactorAuthenticationEnabled: true,
					hidePostMetadataOnPreview: true,
					hideCollectionMetadataOnPreview: true,
					customSideWideCss: true,
					blacklistedArtists: true,
					blacklistedTags: true,
				},
			},
		},
		where: {
			id: userId,
		},
	});

	return user;
}
