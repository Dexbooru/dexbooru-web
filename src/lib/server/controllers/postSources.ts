import type { RequestEvent } from '@sveltejs/kit';
import { getPostSourcesByPostId } from '../db/actions/postSource';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import { GetPostSourcesSchema } from './request-schemas/postSource';

export const handleGetPostSources = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetPostSourcesSchema, async (data) => {
		try {
			const postId = data.pathParams.postId;

			const postSources = await getPostSourcesByPostId(postId);
			return createSuccessResponse('api-route', 'Successfully fetched post sources', {
				postSources,
			});
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				'api-route',
				500,
				'An unexpected error occurred while fetching post sources',
			);
		}
	});
};
