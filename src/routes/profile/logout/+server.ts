import {
	DEXBOORU_NOTIFICATIONS_API_URL,
	DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY,
} from '$lib/server/constants/notifications';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import logger from '$lib/server/logging/logger';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		cookies.delete(SESSION_ID_KEY, { path: '/' });

		const notificationSessionToken = cookies.get(DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY);
		if (notificationSessionToken && DEXBOORU_NOTIFICATIONS_API_URL) {
			try {
				await fetch(`${DEXBOORU_NOTIFICATIONS_API_URL}/api/auth`, {
					method: 'DELETE',
					headers: {
						Cookie: `${DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY}=${notificationSessionToken}`,
					},
				});
			} catch (error) {
				logger.error('Failed to invalidate notification session on logout', error);
			}
		}
	}

	throw redirect(302, '/');
};
