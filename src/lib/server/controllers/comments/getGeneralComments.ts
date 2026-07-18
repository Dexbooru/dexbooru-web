import type { TComment, TCommentPaginationData } from '$lib/shared/types/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { GENERAL_COMMENTS_SELECTORS } from '../../constants/comments';
import { findComments } from '../../db/actions/comment';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_CATEGORY_COMMENTS,
	getCacheKeyWithCategory,
} from '../cache-strategies/comments';
import { GeneralCommentsSchema } from '../request-schemas/comments';
import { withRemoteCache } from '../strategies/withRemoteCache';

export const handleGetGeneralComments = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GeneralCommentsSchema, async (data) => {
		const { orderBy, ascending, pageNumber } = data.urlSearchParams;
		const cacheKey = getCacheKeyWithCategory(pageNumber, orderBy, ascending);

		try {
			const responseData = await withRemoteCache<TCommentPaginationData>({
				cacheKey,
				ttlSeconds: CACHE_TIME_CATEGORY_COMMENTS,
				compute: async () => {
					const comments = (await findComments(
						pageNumber,
						orderBy,
						ascending,
						GENERAL_COMMENTS_SELECTORS,
					)) as TComment[];

					return {
						comments,
						pageNumber,
						orderBy,
						ascending,
					};
				},
			});

			return createSuccessResponse(handlerType, 'Comments fetched successfully', responseData);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occurred while fetching the comments',
			);
		}
	});
};
