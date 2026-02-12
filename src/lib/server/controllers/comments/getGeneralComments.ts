import type { TComment, TCommentPaginationData } from '$lib/shared/types/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { GENERAL_COMMENTS_SELECTORS } from '../../constants/comments';
import { findComments } from '../../db/actions/comment';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../../helpers/sessions';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_CATEGORY_COMMENTS,
	getCacheKeyWithCategory,
} from '../cache-strategies/comments';
import { GeneralCommentsSchema } from '../request-schemas/comments';

export const handleGetGeneralComments = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GeneralCommentsSchema, async (data) => {
		const { orderBy, ascending, pageNumber } = data.urlSearchParams;
		const cacheKey = getCacheKeyWithCategory(pageNumber, orderBy, ascending);
		let responseData: TCommentPaginationData;

		try {
			const cachedData = await getRemoteResponseFromCache<TCommentPaginationData>(cacheKey);
			if (cachedData) {
				responseData = cachedData;
			} else {
				const comments = (await findComments(
					pageNumber,
					orderBy,
					ascending,
					GENERAL_COMMENTS_SELECTORS,
				)) as TComment[];

				responseData = {
					comments,
					pageNumber,
					orderBy,
					ascending,
				};

				cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_CATEGORY_COMMENTS);
			}

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
