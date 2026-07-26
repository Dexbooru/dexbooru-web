import type {
	TRealtimeNotification,
	TNewPostLikeNotification,
	TNewPostCommentNotification,
	TFriendInviteNotification,
	TUserNotifications,
} from '$lib/shared/types/notifcations';
import prisma from '$lib/server/db/prisma';
import { findCommentsByIds } from '$lib/server/db/actions/comment';
import { findPostsByIds } from '$lib/server/db/actions/post';

type TUserDisplayData = {
	id: string;
	username: string;
	profilePictureUrl: string;
};

function extractActorIds(notifications: TRealtimeNotification[]): string[] {
	const ids = new Set<string>();

	for (const n of notifications) {
		switch (n.type) {
			case 'new_post_like':
				ids.add(n.likerUserId);
				break;
			case 'new_post_comment':
				ids.add(n.commentAuthorId);
				if (n.parentCommentAuthorId) ids.add(n.parentCommentAuthorId);
				break;
			case 'friend_invite':
				ids.add(n.senderUserId);
				break;
		}
	}

	return Array.from(ids);
}

function extractCommentIds(notifications: TRealtimeNotification[]): string[] {
	const ids = new Set<string>();

	for (const n of notifications) {
		if (n.type === 'new_post_comment' && n.commentId) {
			ids.add(String(n.commentId));
		}
	}

	return Array.from(ids);
}

function extractPostIds(notifications: TRealtimeNotification[]): string[] {
	const ids = new Set<string>();

	for (const n of notifications) {
		if (n.type === 'new_post_like' || n.type === 'new_post_comment') {
			ids.add(String(n.postId));
		}
	}

	return Array.from(ids);
}

async function fetchUserDisplayData(userIds: string[]): Promise<Map<string, TUserDisplayData>> {
	if (userIds.length === 0) return new Map();

	const users = await prisma.user.findMany({
		where: { id: { in: userIds } },
		select: { id: true, username: true, profilePictureUrl: true },
	});

	return new Map(users.map((u) => [u.id, u]));
}

async function fetchCommentContentById(commentIds: string[]): Promise<Map<string, string>> {
	if (commentIds.length === 0) return new Map();

	const comments = await findCommentsByIds(commentIds, {
		id: true,
		content: true,
	});

	return new Map(comments.map((comment) => [comment.id, comment.content]));
}

async function fetchPostImageUrlById(postIds: string[]): Promise<Map<string, string>> {
	if (postIds.length === 0) return new Map();

	const posts = await findPostsByIds(postIds, {
		id: true,
		imageUrls: true,
	});

	const imageUrlByPostId = new Map<string, string>();
	for (const post of posts) {
		const firstImageUrl = post.imageUrls[0];
		if (firstImageUrl) {
			imageUrlByPostId.set(post.id, firstImageUrl);
		}
	}

	return imageUrlByPostId;
}

function enrichNotification(
	notification: TRealtimeNotification,
	userMap: Map<string, TUserDisplayData>,
	commentContentMap: Map<string, string>,
	postImageUrlMap: Map<string, string>,
): TRealtimeNotification {
	switch (notification.type) {
		case 'new_post_like': {
			const liker = userMap.get(notification.likerUserId);
			return {
				...notification,
				likerUsername: liker?.username ?? '',
				likerProfilePictureUrl: liker?.profilePictureUrl ?? '',
				postImageUrl: postImageUrlMap.get(String(notification.postId)),
			};
		}
		case 'new_post_comment': {
			const author = userMap.get(notification.commentAuthorId);
			const commentId = String(notification.commentId);
			return {
				...notification,
				commentAuthorUsername: author?.username ?? '',
				commentAuthorProfilePictureUrl: author?.profilePictureUrl ?? '',
				commentContent: commentContentMap.get(commentId),
				postImageUrl: postImageUrlMap.get(String(notification.postId)),
			};
		}
		case 'friend_invite': {
			const sender = userMap.get(notification.senderUserId);
			return {
				...notification,
				senderUsername: sender?.username ?? '',
				senderProfilePictureUrl: sender?.profilePictureUrl ?? '',
			};
		}
	}
}

export async function enrichNotifications(
	notifications: TRealtimeNotification[],
): Promise<TRealtimeNotification[]> {
	const actorIds = extractActorIds(notifications);
	const commentIds = extractCommentIds(notifications);
	const postIds = extractPostIds(notifications);
	const [userMap, commentContentMap, postImageUrlMap] = await Promise.all([
		fetchUserDisplayData(actorIds),
		fetchCommentContentById(commentIds),
		fetchPostImageUrlById(postIds),
	]);
	return notifications.map((n) =>
		enrichNotification(n, userMap, commentContentMap, postImageUrlMap),
	);
}

export async function enrichUserNotifications(
	raw: TUserNotifications,
): Promise<TUserNotifications> {
	const allNotifications: TRealtimeNotification[] = [
		...raw.newPostLikes.map((n) => ({ ...n, type: 'new_post_like' as const })),
		...raw.newPostComments.map((n) => ({ ...n, type: 'new_post_comment' as const })),
		...raw.newFriendInvites.map((n) => ({ ...n, type: 'friend_invite' as const })),
	];

	const actorIds = extractActorIds(allNotifications);
	const commentIds = extractCommentIds(allNotifications);
	const postIds = extractPostIds(allNotifications);
	const [userMap, commentContentMap, postImageUrlMap] = await Promise.all([
		fetchUserDisplayData(actorIds),
		fetchCommentContentById(commentIds),
		fetchPostImageUrlById(postIds),
	]);

	return {
		newPostLikes: raw.newPostLikes.map(
			(n) =>
				enrichNotification(
					{ ...n, type: 'new_post_like' },
					userMap,
					commentContentMap,
					postImageUrlMap,
				) as TNewPostLikeNotification,
		),
		newPostComments: raw.newPostComments.map(
			(n) =>
				enrichNotification(
					{ ...n, type: 'new_post_comment' },
					userMap,
					commentContentMap,
					postImageUrlMap,
				) as TNewPostCommentNotification,
		),
		newFriendInvites: raw.newFriendInvites.map(
			(n) =>
				enrichNotification(
					{ ...n, type: 'friend_invite' },
					userMap,
					commentContentMap,
					postImageUrlMap,
				) as TFriendInviteNotification,
		),
	};
}
