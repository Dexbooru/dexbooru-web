import { findPostsByPage } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../../helpers/sessions';
import logger from '../../logging/logger';
import { GetPendingPostsSchema } from '../request-schemas/moderation';
import {
	CACHE_TIME_PENDING_POSTS,
	getCacheKeyForPendingPosts,
} from '../cache-strategies/moderation';
import { handleModerationRoleCheck } from '../reports';
import { PUBLIC_POST_SELECTORS } from '../../constants/posts';
import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import type { TPost } from '$lib/shared/types/posts';
import type { RequestEvent } from '@sveltejs/kit';

export const handleGetPendingPosts = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetPendingPostsSchema,
		async (data) => {
			const { pageNumber } = data.urlSearchParams;
			const cacheKey = getCacheKeyForPendingPosts(pageNumber);

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const cachedData = await getRemoteResponseFromCache<{ pendingPosts: TPost[] }>(cacheKey);
				if (cachedData) {
					return createSuccessResponse(
						'api-route',
						'Pending posts fetched successfully (from cache)',
						cachedData,
					);
				}

				const pendingPosts = await findPostsByPage(
					pageNumber,
					MAXIMUM_POSTS_PER_PAGE,
					'createdAt',
					false,
					PUBLIC_POST_SELECTORS,
					['PENDING'],
				);

				const responseData = { pendingPosts };
				cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_PENDING_POSTS);

				return createSuccessResponse(
					'api-route',
					'Pending posts fetched successfully',
					responseData,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while fetching pending posts.',
				);
			}
		},
		true,
	);
};
