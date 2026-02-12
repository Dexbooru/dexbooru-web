import { isModerationRole } from '$lib/shared/helpers/auth/role';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { findUserById } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { GetModerationDashboardSchema } from '../request-schemas/moderation';

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
