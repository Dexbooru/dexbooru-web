import type { FriendRequest, Prisma } from '$generated/prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/client';

export type TFriendData = {
	friends: TChatFriend[];
	sentFriendRequests: (TChatFriend & { sentAt: Date })[];
	receivedFriendRequests: (TChatFriend & { sentAt: Date })[];
};

export type TFriendRequest = FriendRequest & {
	sentAt: Date;
	senderUser: {
		id: string;
		profilePictureUrl: string;
		username: string;
	};
	receiverUser: {
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
