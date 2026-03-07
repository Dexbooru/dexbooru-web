import type {
	TRealtimeNotification,
	TNewPostLikeNotification,
	TNewPostCommentNotification,
	TFriendInviteNotification,
	TUserNotifications,
} from '$lib/shared/types/notifcations';
import prisma from '$lib/server/db/prisma';

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

async function fetchUserDisplayData(userIds: string[]): Promise<Map<string, TUserDisplayData>> {
	if (userIds.length === 0) return new Map();

	const users = await prisma.user.findMany({
		where: { id: { in: userIds } },
		select: { id: true, username: true, profilePictureUrl: true },
	});

	return new Map(users.map((u) => [u.id, u]));
}

function enrichNotification(
	notification: TRealtimeNotification,
	userMap: Map<string, TUserDisplayData>,
): TRealtimeNotification {
	switch (notification.type) {
		case 'new_post_like': {
			const liker = userMap.get(notification.likerUserId);
			return {
				...notification,
				likerUsername: liker?.username ?? '',
				likerProfilePictureUrl: liker?.profilePictureUrl ?? '',
			};
		}
		case 'new_post_comment': {
			const author = userMap.get(notification.commentAuthorId);
			return {
				...notification,
				commentAuthorUsername: author?.username ?? '',
				commentAuthorProfilePictureUrl: author?.profilePictureUrl ?? '',
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
	const userMap = await fetchUserDisplayData(actorIds);
	return notifications.map((n) => enrichNotification(n, userMap));
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
	const userMap = await fetchUserDisplayData(actorIds);

	return {
		newPostLikes: raw.newPostLikes.map(
			(n) =>
				enrichNotification({ ...n, type: 'new_post_like' }, userMap) as TNewPostLikeNotification,
		),
		newPostComments: raw.newPostComments.map(
			(n) =>
				enrichNotification(
					{ ...n, type: 'new_post_comment' },
					userMap,
				) as TNewPostCommentNotification,
		),
		newFriendInvites: raw.newFriendInvites.map(
			(n) =>
				enrichNotification({ ...n, type: 'friend_invite' }, userMap) as TFriendInviteNotification,
		),
	};
}
