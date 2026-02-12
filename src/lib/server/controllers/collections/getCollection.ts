import { findCollectionById } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../../helpers/sessions';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '../../constants/collections';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../../constants/posts';
import {
	getCacheKeyForIndividualCollection,
	CACHE_TIME_INDIVIDUAL_COLLECTION,
} from '../cache-strategies/collections';
import { GetCollectionSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import { isHttpError, type RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TPostCollection } from '$lib/shared/types/collections';

export const handleGetCollection = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetCollectionSchema, async (data) => {
		const { collectionId } = data.pathParams;

		const cacheKey = getCacheKeyForIndividualCollection(collectionId);
		let finalCollection: TPostCollection;

		try {
			const cachedCollection = await getRemoteResponseFromCache<TPostCollection>(cacheKey);
			if (cachedCollection) {
				finalCollection = cachedCollection;
			} else {
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
					return createErrorResponse(
						handlerType,
						404,
						`A collection with the id: ${collectionId} does not exist`,
					);
				}

				collection.posts.forEach((post) => {
					post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
					post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
				});

				finalCollection = collection;

				cacheResponseRemotely(cacheKey, finalCollection, CACHE_TIME_INDIVIDUAL_COLLECTION);
			}

			return createSuccessResponse(
				handlerType,
				'Successfully fetched the collection',
				finalCollection,
			);
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
