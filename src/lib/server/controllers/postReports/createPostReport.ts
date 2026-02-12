import { createPostReport } from '../../db/actions/postReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { CreatePostReportSchema } from '../request-schemas/postReports';
import type { RequestEvent } from '@sveltejs/kit';

export const handleCreatePostReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreatePostReportSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const { description, category } = data.body;

			try {
				const newPostReport = await createPostReport({
					description,
					category,
					postId,
				});

				return createSuccessResponse(
					'api-route',
					'Successfully created the post report.',
					{ newPostReport },
					201,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occcured while creating the post report.',
				);
			}
		},
	);
};
