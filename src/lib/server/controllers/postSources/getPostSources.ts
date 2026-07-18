import type { PostSource } from '$generated/prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import { getPostSourcesByPostId } from '../../db/actions/postSource';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import {
	CACHE_TIME_FOR_POST_SOURCES,
	getCacheKeyForPostSource,
} from '../cache-strategies/postSources';
import { GetPostSourcesSchema } from '../request-schemas/postSource';
import { withRemoteCache } from '../strategies/withRemoteCache';

export const handleGetPostSources = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetPostSourcesSchema, async (data) => {
		try {
			const postId = data.pathParams.postId;
			const cacheKey = getCacheKeyForPostSource(postId);

			const postSources = await withRemoteCache<PostSource[]>({
				cacheKey,
				ttlSeconds: CACHE_TIME_FOR_POST_SOURCES,
				compute: () => getPostSourcesByPostId(postId),
			});

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
