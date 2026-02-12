import { findCollectionById, updateCollection } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import {
	getRemoteAssociatedKeys,
	invalidateCacheRemotely,
	invalidateMultipleCachesRemotely,
} from '../../helpers/sessions';
import {
	getCacheKeyForIndividualCollection,
	getCacheKeyForIndividualCollectionKeys,
} from '../cache-strategies/collections';
import { UpdateCollectionSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

export const handleUpdateCollection = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UpdateCollectionSchema,
		async (data) => {
			const collectionId = data.pathParams.collectionId;
			const { title, description } = data.body;

			try {
				const collection = await findCollectionById(collectionId, { authorId: true });
				if (!collection) {
					return createErrorResponse(
						'api-route',
						404,
						`A collection with the id: ${collectionId} does not exist`,
					);
				}

				if (collection.authorId !== event.locals.user.id) {
					return createErrorResponse(
						'api-route',
						403,
						`The user with the id: ${event.locals.user.id} is not the author of this collection`,
					);
				}

				const updatedCollection = await updateCollection(collectionId, title, description);

				const cacheKey = getCacheKeyForIndividualCollection(collectionId);
				const associatedKey = getCacheKeyForIndividualCollectionKeys(collectionId);

				invalidateCacheRemotely(cacheKey);
				const associatedCacheKeys = await getRemoteAssociatedKeys(associatedKey);
				invalidateMultipleCachesRemotely(associatedCacheKeys);

				return createSuccessResponse(
					'api-route',
					'Successfully edited the collection',
					updatedCollection,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to edit the collection',
				);
			}
		},
		true,
	);
};
