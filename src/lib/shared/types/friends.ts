export type TFriendRequestAction = 'accept' | 'decline';

export interface IFriendRequestSendBody {
	receiverUserId: string;
}

export interface IFriendRequestHandleBody {
	senderUserId: string;
	action: TFriendRequestAction;
}
