import { findPostCollectionsReportsViaPagination } from '../../db/actions/collectionReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { handleModerationRoleCheck } from '../reports';
import { GetPostCollectionsReportsSchema } from '../request-schemas/collectionReports';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

export const handleGetPostCollectionsReportsGeneral = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetPostCollectionsReportsSchema,
		async (data) => {
			const { pageNumber, reviewStatus, category } = data.urlSearchParams;
			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const postCollectionReports = await findPostCollectionsReportsViaPagination(
					pageNumber,
					reviewStatus,
					category,
				);
				return createSuccessResponse(
					'api-route',
					'Successfully fetched the post collection reports.',
					{
						postCollectionReports,
					},
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching the post collection reports',
				);
			}
		},
		true,
	);
};
