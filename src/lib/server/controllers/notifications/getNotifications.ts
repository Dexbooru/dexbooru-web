import type { RequestEvent } from '@sveltejs/kit';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import type { TRequestSchema } from '../../types/controllers';
import logger from '../../logging/logger';
import {
	DEXBOORU_NOTIFICATIONS_API_URL,
	DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY,
} from '../../constants/notifications';
import { enrichUserNotifications } from '../../helpers/notifications/enrichNotifications';
import type { TUserNotifications } from '$lib/shared/types/notifcations';
import { z } from 'zod';

export const GetNotificationsSchema = {
	urlSearchParams: z.object({
		page: z
			.string()
			.optional()
			.default('1')
			.transform((val) => parseInt(val, 10))
			.refine((val) => !isNaN(val) && val >= 1, { message: 'Page must be at least 1' }),
		limit: z
			.string()
			.optional()
			.default('20')
			.transform((val) => parseInt(val, 10))
			.refine((val) => !isNaN(val) && val > 0 && val <= 100, {
				message: 'Limit must be between 1 and 100',
			}),
		read: z.enum(['true', 'false']).optional(),
	}),
} satisfies TRequestSchema;

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
