import type { TPostCollection } from '$lib/shared/types/collections';
import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../../constants/collections';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../../constants/posts';
import { findCollectionById } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { hydratePostsTagAndArtistEntities } from '../../helpers/postHydration';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_INDIVIDUAL_COLLECTION,
	getCacheKeyForIndividualCollection,
} from '../cache-strategies/collections';
import { GetCollectionSchema } from '../request-schemas/collections';
import { withRemoteCache } from '../strategies/withRemoteCache';

type TCollectionCacheResult = TPostCollection | { notFound: true };

const isNotFound = (result: TCollectionCacheResult): result is { notFound: true } => {
	return 'notFound' in result;
};

export const handleGetCollection = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetCollectionSchema, async (data) => {
		const { collectionId } = data.pathParams;
		const cacheKey = getCacheKeyForIndividualCollection(collectionId);

		try {
			const result = await withRemoteCache<TCollectionCacheResult>({
				cacheKey,
				ttlSeconds: CACHE_TIME_INDIVIDUAL_COLLECTION,
				shouldCache: (value) => !isNotFound(value),
				compute: async () => {
					const collection = await findCollectionById(collectionId, {
						...PUBLIC_POST_COLLECTION_SELECTORS,
						posts: {
							select:
								handlerType === 'page-server-load'
									? PAGE_SERVER_LOAD_POST_SELECTORS
									: PUBLIC_POST_SELECTORS,
						},
					});
					if (!collection) {
						return { notFound: true as const };
					}

					hydratePostsTagAndArtistEntities(collection.posts);
					return collection;
				},
			});

			if (isNotFound(result)) {
				return createErrorResponse(
					handlerType,
					404,
					`A collection with the id: ${collectionId} does not exist`,
				);
			}

			return createSuccessResponse(handlerType, 'Successfully fetched the collection', result);
		} catch (error) {
			if (isHttpError(error)) throw error;

			logger.error(error);

			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occured while fetching the collection',
			);
		}
	});
};
