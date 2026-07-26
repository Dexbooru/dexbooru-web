import type { TNotificationType } from '$lib/shared/types/notifcations';

export enum NotificationMarkAsReadIdKey {
	NewPostLike = 'newPostLikeIds',
	NewPostComment = 'newPostCommentIds',
	FriendInvite = 'friendInviteIds',
}

export const NOTIFICATION_ID_KEYS: Record<TNotificationType, NotificationMarkAsReadIdKey> = {
	new_post_like: NotificationMarkAsReadIdKey.NewPostLike,
	new_post_comment: NotificationMarkAsReadIdKey.NewPostComment,
	friend_invite: NotificationMarkAsReadIdKey.FriendInvite,
};
