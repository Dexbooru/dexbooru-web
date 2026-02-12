import type { RequestEvent } from '@sveltejs/kit';
import { findUserReportsViaPagination } from '../../db/actions/userReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { handleModerationRoleCheck } from '../reports';
import { GetUsersReportsSchema } from '../request-schemas/userReports';

export const handleGetUserReportsGeneral = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetUsersReportsSchema,
		async (data) => {
			const { pageNumber, category, reviewStatus } = data.urlSearchParams;
			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const userReports = await findUserReportsViaPagination(pageNumber, reviewStatus, category);
				return createSuccessResponse('api-route', 'Successfully fetched the user reports.', {
					userReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching the user reports',
				);
			}
		},
		true,
	);
};
