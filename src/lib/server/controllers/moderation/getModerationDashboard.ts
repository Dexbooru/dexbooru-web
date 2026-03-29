import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { isModerationRole } from '$lib/shared/helpers/auth/role';
import { type RequestEvent } from '@sveltejs/kit';
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
				if (event.locals.user.id === NULLABLE_USER.id) {
					return createErrorResponse(
						'page-server-load',
						401,
						'You must be signed in to access the moderation dashboard.',
					);
				}

				const user = await findUserById(event.locals.user.id, { role: true });
				if (!user || !isModerationRole(user.role)) {
					return createErrorResponse(
						'page-server-load',
						403,
						'You do not have permission to access this page. Moderator or site owner access is required.',
					);
				}

				return createSuccessResponse(
					'page-server-load',
					'Moderation dashboard loaded successfully',
				);
			} catch (err) {
				logger.error(err);

				return createErrorResponse(
					'page-server-load',
					500,
					'An error occurred while loading the moderation dashboard.',
				);
			}
		},
		false,
	);
};
