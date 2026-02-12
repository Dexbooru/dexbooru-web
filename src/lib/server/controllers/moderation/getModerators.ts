import { findAllModerators } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { GetModeratorsSchema } from '../request-schemas/moderation';
import { handleModerationRoleCheck } from '../reports';
import type { RequestEvent } from '@sveltejs/kit';

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
