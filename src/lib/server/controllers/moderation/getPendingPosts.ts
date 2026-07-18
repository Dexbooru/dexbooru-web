import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import type { TPost } from '$lib/shared/types/posts';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_POST_SELECTORS } from '../../constants/posts';
import { findPostsByPage } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import {
	CACHE_TIME_PENDING_POSTS,
	getCacheKeyForPendingPosts,
} from '../cache-strategies/moderation';
import { GetPendingPostsSchema } from '../request-schemas/moderation';
import { handleModerationRoleCheck } from '../reports';
import { withRemoteCache } from '../strategies/withRemoteCache';

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

				const responseData = await withRemoteCache<{ pendingPosts: TPost[] }>({
					cacheKey,
					ttlSeconds: CACHE_TIME_PENDING_POSTS,
					compute: async () => {
						const pendingPosts = await findPostsByPage(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							'createdAt',
							false,
							PUBLIC_POST_SELECTORS,
							['PENDING'],
						);
						return { pendingPosts };
					},
				});

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
