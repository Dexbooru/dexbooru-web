import { DEXBOORU_NOTIFICATIONS_API_API_URL } from '../constants/notificationApi';
import type { TUserNotifications, TRealtimeNotification } from '$lib/shared/types/notifcations';
import { buildUrl } from '$lib/client/helpers/urls';

export const authenticateNotificationSession = async (): Promise<Response> => {
	const url = `${DEXBOORU_NOTIFICATIONS_API_API_URL}/api/auth`;

	return await fetch(url, {
		method: 'POST',
		credentials: 'include',
	});
};

export const getNotifications = async (
	page: number = 0,
	limit: number = 20,
	read?: boolean,
): Promise<TUserNotifications | null> => {
	const params: Record<string, string> = {
		page: page.toString(),
		limit: limit.toString(),
	};
	if (read !== undefined) params.read = read.toString();

	const url = buildUrl('/api/notifications', params);
	const response = await fetch(url);

	if (!response.ok) return null;

	const body = (await response.json()) as { data: TUserNotifications };
	return body.data;
};

export const enrichRealtimeNotifications = async (
	notifications: TRealtimeNotification[],
): Promise<TRealtimeNotification[]> => {
	const response = await fetch('/api/notifications/enrich', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ notifications }),
	});

	if (!response.ok) return notifications;

	const body = (await response.json()) as { notifications: TRealtimeNotification[] };
	return body.notifications;
};

export type TMarkAsReadRequest = {
	all?: boolean;
	notificationIds?: {
		newPostLikeIds?: string[];
		newPostCommentIds?: string[];
		friendInviteIds?: string[];
	};
};

export const markNotificationsAsRead = async (
	request: TMarkAsReadRequest,
): Promise<{ markedCount: number } | null> => {
	const response = await fetch('/api/notifications', {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(request),
	});

	if (!response.ok) return null;

	const body = (await response.json()) as { data: { markedCount: number } };
	return body.data;
};

export const logoutNotificationSession = async (): Promise<void> => {
	const url = `${DEXBOORU_NOTIFICATIONS_API_API_URL}/api/auth`;

	await fetch(url, {
		method: 'DELETE',
		credentials: 'include',
	}).catch(() => {});
};
