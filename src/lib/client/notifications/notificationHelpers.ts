import DefaultPostPicture from '$lib/client/assets/default_post_picture.webp';
import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';
import type { TMarkAsReadRequest } from '$lib/client/api/notificationApi';
import {
	COMMENT_CONTENT_PREVIEW_ELLIPSIS,
	COMMENT_CONTENT_PREVIEW_LENGTH,
} from '$lib/shared/constants/comments';
import { NOTIFICATION_ID_KEYS } from '$lib/shared/constants/notifications';
import type { TRealtimeNotification } from '$lib/shared/types/notifcations';
import { convert as htmlToText } from 'html-to-text';

export function getActorAvatar(notification: TRealtimeNotification): string {
	switch (notification.type) {
		case 'new_post_like':
			return notification.likerProfilePictureUrl || DefaultProfilePicture;
		case 'new_post_comment':
			return notification.commentAuthorProfilePictureUrl || DefaultProfilePicture;
		case 'friend_invite':
			return notification.senderProfilePictureUrl || DefaultProfilePicture;
	}
}

export function getActorUsername(notification: TRealtimeNotification): string {
	switch (notification.type) {
		case 'new_post_like':
			return notification.likerUsername || 'Someone';
		case 'new_post_comment':
			return notification.commentAuthorUsername || 'Someone';
		case 'friend_invite':
			return notification.senderUsername || 'Someone';
	}
}

export function getNotificationMessage(notification: TRealtimeNotification): string {
	switch (notification.type) {
		case 'new_post_like':
			return 'liked your post';
		case 'new_post_comment':
			return 'commented on your post';
		case 'friend_invite':
			return notification.status === 'ACCEPTED'
				? 'accepted your friend request'
				: 'sent you a friend request';
	}
}

export function getNotificationLink(notification: TRealtimeNotification): string {
	switch (notification.type) {
		case 'new_post_like':
			return `/posts/${notification.postId}`;
		case 'new_post_comment':
			return `/posts/${notification.postId}#comment-${notification.commentId}`;
		case 'friend_invite':
			return '/friends';
	}
}

export function getTypeLabel(notification: TRealtimeNotification): string {
	switch (notification.type) {
		case 'new_post_like':
			return 'Like';
		case 'new_post_comment':
			return 'Comment';
		case 'friend_invite':
			return 'Friend';
	}
}

export function getTypeBadgeColor(notification: TRealtimeNotification): string {
	switch (notification.type) {
		case 'new_post_like':
			return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
		case 'new_post_comment':
			return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
		case 'friend_invite':
			return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
	}
}

export function onAvatarError(event: Event): void {
	const target = event.target as HTMLImageElement;
	target.src = DefaultProfilePicture;
}

export function getPostImageUrl(notification: TRealtimeNotification): string | undefined {
	if (notification.type === 'new_post_like' || notification.type === 'new_post_comment') {
		return notification.postImageUrl;
	}
	return undefined;
}

export function onPostImageError(event: Event): void {
	const target = event.target as HTMLImageElement;
	target.src = DefaultPostPicture;
}

export function buildMarkSingleAsReadRequest(
	notification: TRealtimeNotification,
): TMarkAsReadRequest {
	const key = NOTIFICATION_ID_KEYS[notification.type];
	return {
		notificationIds: { [key]: [notification._id] },
	};
}

export function getCommentNotificationPreview(htmlContent: string): string {
	let plainText: string;
	try {
		plainText = htmlToText(htmlContent, { wordwrap: false });
	} catch {
		plainText = htmlContent.replace(/<[^>]*>/g, '');
	}

	const normalized = plainText.replace(/\s+/g, ' ').trim();
	if (normalized.length <= COMMENT_CONTENT_PREVIEW_LENGTH) {
		return normalized;
	}

	return (
		normalized.slice(0, COMMENT_CONTENT_PREVIEW_LENGTH).trimEnd() + COMMENT_CONTENT_PREVIEW_ELLIPSIS
	);
}
