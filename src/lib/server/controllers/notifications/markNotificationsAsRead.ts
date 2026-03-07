import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import {
	DEXBOORU_NOTIFICATIONS_API_URL,
	DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY,
} from '../../constants/notifications';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TRequestSchema } from '../../types/controllers';

export const MarkNotificationsAsReadSchema = {
	body: z.object({
		all: z.boolean().optional().default(false),
		notificationIds: z
			.object({
				newPostLikeIds: z.array(z.string()).optional().default([]),
				newPostCommentIds: z.array(z.string()).optional().default([]),
				friendInviteIds: z.array(z.string()).optional().default([]),
			})
			.optional()
			.default({
				newPostCommentIds: [],
				newPostLikeIds: [],
				friendInviteIds: [],
			}),
	}),
} satisfies TRequestSchema;

export const handleMarkNotificationsAsRead = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		MarkNotificationsAsReadSchema,
		async (data) => {
			try {
				const sessionToken = event.cookies.get(DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY);

				if (!DEXBOORU_NOTIFICATIONS_API_URL) {
					return createErrorResponse('api-route', 503, 'Notifications service is not configured');
				}

				if (!sessionToken) {
					return createErrorResponse('api-route', 401, 'Notification session not established');
				}

				const response = await fetch(`${DEXBOORU_NOTIFICATIONS_API_URL}/api/notifications`, {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Cookie: `${DEXBOORU_NOTIFICATIONS_SESSION_COOKIE_KEY}=${sessionToken}`,
					},
					body: JSON.stringify(data.body),
				});

				if (!response.ok) {
					return createErrorResponse(
						'api-route',
						response.status,
						`Notifications service returned status ${response.status}`,
					);
				}

				const body = (await response.json()) as { data: { markedCount: number } };

				return createSuccessResponse('api-route', 'Notifications marked as read', body.data);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while marking notifications as read',
				);
			}
		},
		true,
	);
};
