import { UUID_REGEX } from '$lib/shared/constants/search';
import type { RequestEvent } from '@sveltejs/kit';
import { findUserById, findUserByName } from '../../db/actions/user';
import { findUserReportsFromUserId } from '../../db/actions/userReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { handleModerationRoleCheck } from '../reports';
import { GetUserReportsSchema } from '../request-schemas/userReports';

export const handleGetUserReports = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetUserReportsSchema,
		async (data) => {
			const username = data.pathParams.username;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, handlerType);
				if (moderationFailureResponse) return moderationFailureResponse;

				const dbFindFn = UUID_REGEX.test(username) ? findUserById : findUserByName;
				const user = await dbFindFn(username, { id: true });
				if (!user) {
					return createErrorResponse(
						handlerType,
						404,
						'The user you are trying to fetch reports for does not exist.',
					);
				}

				const userReports = await findUserReportsFromUserId(user.id);
				return createSuccessResponse(handlerType, 'Successfully fetched the user reports.', {
					userReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occurred while fetching the user reports.',
				);
			}
		},
		true,
	);
};
