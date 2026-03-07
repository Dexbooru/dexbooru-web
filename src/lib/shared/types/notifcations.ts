export type TNotificationType = 'new_post_like' | 'new_post_comment' | 'friend_invite';

export type TFriendInviteStatus = 'SENT' | 'ACCEPTED';

export type TNewPostLikeNotification = {
	_id: string;
	type: 'new_post_like';
	postId: string;
	postAuthorId: string;
	likerUserId: string;
	likerUsername?: string;
	likerProfilePictureUrl?: string;
	totalLikes: number;
	wasRead: boolean;
};

export type TNewPostCommentNotification = {
	_id: string;
	type: 'new_post_comment';
	postId: string;
	postAuthorId: string;
	commentAuthorId: string;
	commentAuthorUsername?: string;
	commentAuthorProfilePictureUrl?: string;
	commentContent: string;
	parentCommentId: string | null;
	parentCommentAuthorId: string | null;
	wasRead: boolean;
};

export type TFriendInviteNotification = {
	_id: string;
	type: 'friend_invite';
	senderUserId: string;
	senderUsername?: string;
	senderProfilePictureUrl?: string;
	receiverUserId: string;
	requestSentAt: string;
	wasRead: boolean;
	status: TFriendInviteStatus;
};

export type TRealtimeNotification =
	| TNewPostLikeNotification
	| TNewPostCommentNotification
	| TFriendInviteNotification;

export type TUserNotifications = {
	newPostLikes: TNewPostLikeNotification[];
	newPostComments: TNewPostCommentNotification[];
	newFriendInvites: TFriendInviteNotification[];
};

export type TEnrichedNotificationResponse = {
	notifications: TRealtimeNotification[];
};
