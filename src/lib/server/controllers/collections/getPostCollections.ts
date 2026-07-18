import type { TCollectionPaginationData } from '$lib/shared/types/collections';
import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../../constants/collections';
import { findCollectionsForPost } from '../../db/actions/collection';
import { findPostById } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_INDIVIDUAL_COLLECTIONS_FOR_POST,
	getCacheKeyForCollectionsForPost,
} from '../cache-strategies/collections';
import { GetPostCollectionsSchema } from '../request-schemas/collections';
import { withRemoteCache } from '../strategies/withRemoteCache';

type TPostCollectionsResult = TCollectionPaginationData | { notFound: true };

const isNotFound = (result: TPostCollectionsResult): result is { notFound: true } => {
	return 'notFound' in result;
};

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
			const cacheKey = getCacheKeyForCollectionsForPost(postId, orderBy, ascending, pageNumber);

			try {
				const result = await withRemoteCache<TPostCollectionsResult>({
					cacheKey,
					ttlSeconds: CACHE_TIME_INDIVIDUAL_COLLECTIONS_FOR_POST,
					shouldCache: (value) => !isNotFound(value),
					compute: async () => {
						const post = await findPostById(postId, { id: true });
						if (!post) {
							return { notFound: true as const };
						}

						const collections = await findCollectionsForPost(
							postId,
							pageNumber,
							ascending,
							orderBy,
							PUBLIC_POST_COLLECTION_SELECTORS,
						);

						return {
							collections,
							pageNumber,
							orderBy,
							ascending,
						};
					},
				});

				if (isNotFound(result)) {
					return createErrorResponse(
						handlerType,
						404,
						`A post with the id: ${postId} does not exist`,
					);
				}

				return createSuccessResponse(
					handlerType,
					'Successfully fetched the collections for the post',
					result,
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
