import type { PostSource } from '$generated/prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import { getPostSourcesByPostId } from '../db/actions/postSource';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../helpers/sessions';
import logger from '../logging/logger';
import {
	CACHE_TIME_FOR_POST_SOURCES,
	getCacheKeyForPostSource,
} from './cache-strategies/postSources';
import { GetPostSourcesSchema } from './request-schemas/postSource';

export const handleGetPostSources = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetPostSourcesSchema, async (data) => {
		try {
			const postId = data.pathParams.postId;

			const cacheKey = getCacheKeyForPostSource(postId);
			const cachedPostSources = await getRemoteResponseFromCache<PostSource[]>(cacheKey);

			if (cachedPostSources) {
				return createSuccessResponse('api-route', 'Successfully fetched post sources from cache', {
					postSources: cachedPostSources,
				});
			}

			const postSources = await getPostSourcesByPostId(postId);
			cacheResponseRemotely(cacheKey, postSources, CACHE_TIME_FOR_POST_SOURCES);

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
