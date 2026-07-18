import {
	TOP_K_LABEL_COUNT,
	TOP_K_POST_LIKE_COUNT,
	TOP_K_POST_LOOKBACK_HOURS,
} from '$lib/shared/constants/analytics';
import type { RequestEvent } from '@sveltejs/kit';
import {
	findTopKMostLikedPosts,
	findTopKMostViewedPosts,
	findTopKPopularArtists,
	findTopKPopularTags,
} from '../../db/actions/analytics';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_PRIMARY_ANALYTICS_SECONDS,
	getAnalyticsCacheKey,
} from '../cache-strategies/analytics';
import { withRemoteCache } from '../strategies/withRemoteCache';

export const handleGetAnalytics = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, {}, async (_) => {
		try {
			const cacheKey = getAnalyticsCacheKey();
			const responseData = await withRemoteCache({
				cacheKey,
				ttlSeconds: CACHE_TIME_PRIMARY_ANALYTICS_SECONDS,
				compute: async () => {
					const topTags = await findTopKPopularTags(TOP_K_LABEL_COUNT);
					const topArtists = await findTopKPopularArtists(TOP_K_LABEL_COUNT);
					const topLikedPosts = await findTopKMostLikedPosts(
						TOP_K_POST_LIKE_COUNT,
						TOP_K_POST_LOOKBACK_HOURS,
					);
					const topViewedPosts = await findTopKMostViewedPosts(
						TOP_K_POST_LIKE_COUNT,
						TOP_K_POST_LOOKBACK_HOURS,
					);

					return {
						topTags,
						topArtists,
						topLikedPosts,
						topViewedPosts,
					};
				},
			});

			return createSuccessResponse(
				handlerType,
				'Successfully fetched analytics data.',
				responseData,
			);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occurred while fetching analytics data.',
			);
		}
	});
};
