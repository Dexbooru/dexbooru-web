import type {
	IFriendRequest,
	TChatFriend,
	TFriendRequestSelector,
} from '$lib/shared/types/friends';
import type { FriendRequest } from '@prisma/client';
import prisma from '../prisma';

export async function findFriendRequests(
	receiverUserId: string,
	selectors?: TFriendRequestSelector,
): Promise<IFriendRequest[]> {
	const friendRequestsReceived = await prisma.friendRequest.findMany({
		where: {
			receiverUserId,
		},
		select: selectors,
		orderBy: {
			sentAt: 'desc',
		},
	});

	return friendRequestsReceived as IFriendRequest[];
}

export async function createFriendRequest(
	senderUserId: string,
	receiverUserId: string,
): Promise<FriendRequest> {
	const newFriendRequest = await prisma.friendRequest.create({
		data: {
			senderUserId,
			receiverUserId,
		},
	});

	return newFriendRequest;
}

export async function deleteFriendRequest(
	senderUserId: string,
	receiverUserId: string,
): Promise<boolean> {
	const deleteFriendRequestBatchResult = await prisma.friendRequest.deleteMany({
		where: {
			OR: [
				{
					senderUserId,
					receiverUserId,
				},
				{
					senderUserId: receiverUserId,
					receiverUserId: senderUserId,
				},
			],
		},
	});

	return deleteFriendRequestBatchResult.count > 0;
}

export async function checkIfUserIsFriended(
	senderUserId: string,
	receiverUserId: string,
): Promise<boolean> {
	const friendRequest = await prisma.friendRequest.findFirst({
		where: {
			senderUserId,
			receiverUserId,
		},
	});

	return !!friendRequest;
}

export async function findFriendsForUser(userId: string): Promise<TChatFriend[]> {
	const data = await prisma.user.findFirst({
		where: {
			id: userId,
		},
		select: {
			friends: {
				select: {
					id: true,
					username: true,
					profilePictureUrl: true,
				},
			},
		},
	});

	return data?.friends ?? [];
}
