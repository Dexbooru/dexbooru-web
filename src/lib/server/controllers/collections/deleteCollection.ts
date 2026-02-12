import { deleteCollectionById, findCollectionById } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { deleteBatchFromBucket } from '../../aws/actions/s3';
import { AWS_COLLECTION_PICTURE_BUCKET_NAME } from '../../constants/aws';
import {
	getRemoteAssociatedKeys,
	invalidateCacheRemotely,
	invalidateMultipleCachesRemotely,
} from '../../helpers/sessions';
import {
	getCacheKeyForIndividualCollection,
	getCacheKeyForIndividualCollectionKeys,
} from '../cache-strategies/collections';
import { DeleteCollectionSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

export const handleDeleteCollection = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeleteCollectionSchema,
		async (data) => {
			const collectionId = data.pathParams.collectionId;

			try {
				const collection = await findCollectionById(collectionId, {
					authorId: true,
					thumbnailImageUrls: true,
				});
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

				await deleteCollectionById(collectionId, event.locals.user.id);
				if (collection.thumbnailImageUrls.length > 0) {
					await deleteBatchFromBucket(
						AWS_COLLECTION_PICTURE_BUCKET_NAME,
						collection.thumbnailImageUrls,
					);
				}

				const individualCacheKey = getCacheKeyForIndividualCollection(collectionId);
				const associatedCacheKey = getCacheKeyForIndividualCollectionKeys(collectionId);

				invalidateCacheRemotely(individualCacheKey);
				const associatedCacheKeys = await getRemoteAssociatedKeys(associatedCacheKey);
				invalidateMultipleCachesRemotely(associatedCacheKeys);

				return createSuccessResponse('api-route', 'Successfully deleted the collection');
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to delete the collection',
				);
			}
		},
		true,
	);
};
