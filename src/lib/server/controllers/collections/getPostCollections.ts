import { findPostById } from '../../db/actions/post';
import { findCollectionsForPost } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { getRemoteResponseFromCache } from '../../helpers/sessions';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../../constants/collections';
import { getCacheKeyForCollectionsForPost } from '../cache-strategies/collections';
import { GetPostCollectionsSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TCollectionPaginationData } from '$lib/shared/types/collections';

export const handleGetPostCollections = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetPostCollectionsSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const { pageNumber, orderBy, ascending } = data.urlSearchParams;

			let responseData: TCollectionPaginationData;
			const cacheKey = getCacheKeyForCollectionsForPost(postId);

			try {
				const cachedData = await getRemoteResponseFromCache<TCollectionPaginationData>(cacheKey);
				if (cachedData) {
					responseData = cachedData;
				} else {
					const post = await findPostById(postId, { id: true });
					if (!post) {
						return createErrorResponse(
							handlerType,
							404,
							`A post with the id: ${postId} does not exist`,
						);
					}

					const collections = await findCollectionsForPost(
						postId,
						pageNumber,
						ascending,
						orderBy,
						PUBLIC_POST_COLLECTION_SELECTORS,
					);
					responseData = {
						collections,
						pageNumber,
						orderBy,
						ascending,
					};
				}

				return createSuccessResponse(
					handlerType,
					'Successfully fetched the collections for the post',
					responseData,
				);
			} catch (error) {
				if (isHttpError(error)) throw error;

				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while fetching the collections for the post',
				);
			}
		},
	);
};
