import type { FriendRequest, Prisma } from '@prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/library';

export type TFriendRequest = FriendRequest & {
	senderUser: {
		id: string;
		profilePictureUrl: string;
		username: string;
	};
};

export type TChatFriend = {
	id: string;
	username: string;
	profilePictureUrl: string;
};

export type TFriendRequestSelector = Prisma.FriendRequestSelect<DefaultArgs>;

export type TFriendRequestAction = 'accept' | 'decline';
export type TFriendStatus =
	| 'not-friends'
	| 'request-pending'
	| 'are-friends'
	| 'is-self'
	| 'irrelevant';

export type TFriendRequestSendBody = {
	receiverUsername: string;
};

export type TFriendRequestHandleBody = {
	action: TFriendRequestAction;
};

export type TFriendRemoveBody = {
	receiverUserId: string;
};
