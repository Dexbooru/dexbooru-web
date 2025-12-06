import type { TFriendRequestAction, TFriendRequestSelector } from '$lib/shared/types/friends';

export const PUBLIC_FRIEND_REQUEST_SELECTORS: TFriendRequestSelector = {
	sentAt: true,
	senderUser: {
		select: {
			username: true,
			id: true,
			profilePictureUrl: true,
		},
	},
};

export const FRIEND_REQUEST_ACTIONS: TFriendRequestAction[] = ['accept', 'decline'] as const;
