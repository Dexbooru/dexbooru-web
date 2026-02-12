import { findPostReportsViaPagination } from '../../db/actions/postReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { handleModerationRoleCheck } from '../reports';
import { GetPostsReportsSchema } from '../request-schemas/postReports';
import type { RequestEvent } from '@sveltejs/kit';

export const handleGetPostsReportsGeneral = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetPostsReportsSchema,
		async (data) => {
			const { pageNumber, reviewStatus, category } = data.urlSearchParams;
			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const postReports = await findPostReportsViaPagination(pageNumber, reviewStatus, category);
				return createSuccessResponse('api-route', 'Successfully fetched the post reports.', {
					postReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching the post reports',
				);
			}
		},
		true,
	);
};
