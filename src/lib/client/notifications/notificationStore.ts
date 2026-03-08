import { writable, derived } from 'svelte/store';
import { ConnectionState, NotificationWebSocketClient } from './NotificationWebSocketClient';
import type { TRealtimeNotification, TUserNotifications } from '$lib/shared/types/notifcations';
import { DEXBOORU_NOTIFICATIONS_API_API_URL } from '$lib/client/constants/notificationApi';
import { markNotificationsAsRead, type TMarkAsReadRequest } from '$lib/client/api/notificationApi';
import newNotificationSoundUrl from '$lib/client/assets/sounds/new_notification.ogg';

const NOTIFICATION_SOUND_COOLDOWN_MS = 200;
let lastNotificationSoundPlayedAt = 0;

function playNewNotificationSound(): void {
	const now = Date.now();
	if (now - lastNotificationSoundPlayedAt < NOTIFICATION_SOUND_COOLDOWN_MS) return;
	lastNotificationSoundPlayedAt = now;
	const audio = new Audio(newNotificationSoundUrl);
	audio.play().catch(() => {});
}

const notifications = writable<TRealtimeNotification[]>([]);
const connectionState = writable<ConnectionState>(ConnectionState.Disconnected);
const initialLoaded = writable(false);
const authenticationFailed = writable(false);

const unreadCount = derived(
	notifications,
	($notifications) => $notifications.filter((n) => !n.wasRead).length,
);

let client: NotificationWebSocketClient | null = null;

function flattenUserNotifications(data: TUserNotifications): TRealtimeNotification[] {
	return [
		...data.newPostLikes.map((n) => ({ ...n, type: 'new_post_like' as const })),
		...data.newPostComments.map((n) => ({ ...n, type: 'new_post_comment' as const })),
		...data.newFriendInvites.map((n) => ({ ...n, type: 'friend_invite' as const })),
	];
}

function deduplicatedPrepend(
	incoming: TRealtimeNotification[],
	existing: TRealtimeNotification[],
): TRealtimeNotification[] {
	const existingIds = new Set(existing.map((n) => n._id));
	const novel = incoming.filter((n) => !existingIds.has(n._id));
	return [...novel, ...existing];
}

async function enrichAndAdd(raw: TRealtimeNotification): Promise<void> {
	const withId: TRealtimeNotification = raw._id
		? raw
		: { ...raw, _id: `tmp_${crypto.randomUUID()}` };

	try {
		const response = await fetch('/api/notifications/enrich', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notifications: [withId] }),
		});

		if (response.ok) {
			const data = (await response.json()) as { notifications: TRealtimeNotification[] };
			notifications.update((list) => deduplicatedPrepend(data.notifications, list));
			playNewNotificationSound();
		} else {
			notifications.update((list) => deduplicatedPrepend([withId], list));
			playNewNotificationSound();
		}
	} catch {
		notifications.update((list) => deduplicatedPrepend([withId], list));
		playNewNotificationSound();
	}
}

function initialize(): void {
	if (client) return;

	client = new NotificationWebSocketClient(DEXBOORU_NOTIFICATIONS_API_API_URL, {
		onMessage: (notification) => {
			enrichAndAdd(notification);
		},
		onStateChange: (state) => {
			connectionState.set(state);
		},
		onAuthenticationFailed: () => {
			authenticationFailed.set(true);
		},
	});
}

function connect(): void {
	initialize();
	authenticationFailed.set(false);
	client?.connect();
}

function disconnect(): void {
	client?.disconnect();
	client = null;
}

async function fetchInitialNotifications(): Promise<void> {
	try {
		const response = await fetch('/api/notifications');
		if (!response.ok) return;

		const body = (await response.json()) as { data: TUserNotifications };
		notifications.set(flattenUserNotifications(body.data));
		initialLoaded.set(true);
	} catch {
		initialLoaded.set(true);
	}
}

async function fetchPaginatedNotifications(
	page: number,
	limit: number,
	read?: boolean,
): Promise<TRealtimeNotification[]> {
	const params: Record<string, string> = {
		page: page.toString(),
		limit: limit.toString(),
	};
	if (read !== undefined) params.read = read.toString();

	const query = new URLSearchParams(params).toString();
	const response = await fetch(`/api/notifications?${query}`);
	if (!response.ok) return [];

	const body = (await response.json()) as { data: TUserNotifications };
	return flattenUserNotifications(body.data);
}

async function markAsRead(request: TMarkAsReadRequest): Promise<boolean> {
	const result = await markNotificationsAsRead(request);
	if (!result) return false;

	if (request.all) {
		notifications.set([]);
	} else {
		const ids = new Set([
			...(request.notificationIds?.newPostLikeIds ?? []),
			...(request.notificationIds?.newPostCommentIds ?? []),
			...(request.notificationIds?.friendInviteIds ?? []),
		]);

		notifications.update((list) => list.map((n) => (ids.has(n._id) ? { ...n, wasRead: true } : n)));
	}

	return true;
}

function reset(): void {
	disconnect();
	notifications.set([]);
	connectionState.set(ConnectionState.Disconnected);
	initialLoaded.set(false);
	authenticationFailed.set(false);
}

export const notificationStore = {
	notifications,
	unreadCount,
	connectionState,
	initialLoaded,
	authenticationFailed,
	connect,
	disconnect,
	fetchInitialNotifications,
	fetchPaginatedNotifications,
	markAsRead,
	reset,
};
