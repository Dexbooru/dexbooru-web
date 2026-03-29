import { DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY } from '$lib/server/constants/notifications';
import { clearNotificationSessionCookie, clearSessionIdCookie } from '$lib/server/helpers/cookies';
import { invalidateRemoteNotificationSession } from '$lib/server/helpers/notificationSession';
import logger from '$lib/server/logging/logger';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';

export async function handleLogout(event: RequestEvent): Promise<never> {
	try {
		const { locals, cookies } = event;

		if (locals.user) {
			const notificationSessionToken = cookies.get(DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY);

			clearSessionIdCookie(cookies);
			clearNotificationSessionCookie(cookies);
			await invalidateRemoteNotificationSession(notificationSessionToken);
		}

		redirect(302, '/');
	} catch (error) {
		if (isRedirect(error)) {
			throw error;
		}
		logger.error('Unexpected error during logout', error);
		redirect(302, '/');
	}
}
