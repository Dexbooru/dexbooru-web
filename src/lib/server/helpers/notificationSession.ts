import {
	DEXBOORU_NOTIFICATIONS_API_URL,
	DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY,
} from '$lib/server/constants/notifications';
import logger from '$lib/server/logging/logger';

/**
 * Calls the notifications API to invalidate the session cookie value (server-to-server DELETE).
 * No-op if the API URL is unset or the token is missing.
 */
export async function invalidateRemoteNotificationSession(
	sessionToken: string | undefined,
): Promise<void> {
	if (!sessionToken || !DEXBOORU_NOTIFICATIONS_API_URL) {
		return;
	}

	try {
		await fetch(`${DEXBOORU_NOTIFICATIONS_API_URL}/api/auth`, {
			method: 'DELETE',
			headers: {
				Cookie: `${DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY}=${sessionToken}`,
			},
		});
	} catch (error) {
		logger.error('Failed to invalidate notification session on logout', error);
	}
}
