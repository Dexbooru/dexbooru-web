import type { RequestEvent } from '@sveltejs/kit';
import { getUserNotificationsFromId } from '../db/actions/notification';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import type { TRequestSchema } from '../types/controllers';
import logger from '../logging/logger';

const GetNotificationsSchema = {} satisfies TRequestSchema;

export const handleGetNotifications = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetNotificationsSchema,
		async (_) => {
			try {
				const userId = event.locals.user.id;
				const notificationData = await getUserNotificationsFromId(userId);

				return createSuccessResponse(
					'api-route',
					`Successfully retrieved notifications for user id: ${userId}`,
					notificationData,
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
