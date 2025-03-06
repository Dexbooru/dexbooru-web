import { isModerationRole } from '$lib/shared/helpers/auth/role';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { findAllModerators, findUserById } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import { GetModerationDashboardSchema, GetModeratorsSchema } from './request-schemas/moderation';
import { handleModerationRoleCheck } from './reports';

export const handleGetModerationDashboard = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		GetModerationDashboardSchema,
		async (_) => {
			try {
				const user = await findUserById(event.locals.user.id, { role: true });
				if (!user || !isModerationRole(user?.role)) {
					redirect(302, '/');
				}

				return createSuccessResponse(
					'page-server-load',
					'Moderation dashboard loaded successfully',
				);
			} catch (error) {
				if (isRedirect(error)) throw error;

				logger.error(error);

				return createErrorResponse(
					'page-server-load',
					500,
					'An error occurred while loading the moderation dashboard.',
				);
			}
		},
		true,
	);
};

export const handleGetModerators = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetModeratorsSchema,
		async (_) => {
			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const moderators = await findAllModerators();
				return createSuccessResponse('api-route', 'Moderators fetched successfully', {
					moderators,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while fetching moderators.',
				);
			}
		},
		true,
	);
};
