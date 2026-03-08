import type { TUserNotifications } from '$lib/shared/types/notifcations';
import type { RequestEvent } from '@sveltejs/kit';
import {
	DEXBOORU_NOTIFICATIONS_API_URL,
	DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY,
} from '../../constants/notifications';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { enrichUserNotifications } from '../../helpers/notifications/enrichNotifications';
import logger from '../../logging/logger';
import { GetNotificationsSchema } from '../request-schemas/notifications';

export const handleGetNotifications = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetNotificationsSchema,
		async (data) => {
			try {
				const { page, limit, read } = data.urlSearchParams;
				const userId = event.locals.user.id;
				const sessionToken = event.cookies.get(DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY);

				if (!DEXBOORU_NOTIFICATIONS_API_URL) {
					return createErrorResponse('api-route', 503, 'Notifications service is not configured');
				}

				if (!sessionToken) {
					return createErrorResponse('api-route', 401, 'Notification session not established');
				}

				const url = new URL(`${DEXBOORU_NOTIFICATIONS_API_URL}/api/notifications`);
				url.searchParams.set('page', page.toString());
				url.searchParams.set('limit', limit.toString());
				if (read !== undefined) url.searchParams.set('read', read);

				const response = await fetch(url.toString(), {
					headers: {
						Cookie: `${DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY}=${sessionToken}`,
					},
				});

				if (!response.ok) {
					return createErrorResponse(
						'api-route',
						response.status,
						`Notifications service returned status ${response.status}`,
					);
				}

				const body = (await response.json()) as { data: TUserNotifications };
				const enriched = await enrichUserNotifications(body.data);

				return createSuccessResponse(
					'api-route',
					`Successfully retrieved notifications for user id: ${userId}`,
					enriched,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while fetching the user notifications',
				);
			}
		},
		true,
	);
};
