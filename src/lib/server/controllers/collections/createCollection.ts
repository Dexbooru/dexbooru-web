import { createCollection, deleteCollectionById } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { deleteBatchFromBucket, uploadBatchToBucket } from '../../aws/actions/s3';
import { AWS_COLLECTION_PICTURE_BUCKET_NAME } from '../../constants/aws';
import {
	applyCollectionImageTransformationPipeline,
	flattenImageBuffers,
} from '../../helpers/images';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import { getCacheKeyForGeneralCollectionPagination } from '../cache-strategies/collections';
import { CreateCollectionSchema } from '../request-schemas/collections';
import logger from '../../logging/logger';
import { isRedirect, type RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { createCollectionFormErrorData } from './helpers';

export const handleCreateCollection = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		CreateCollectionSchema,
		async (data) => {
			const { title, description, collectionThumbnail, isNsfw } = data.form;
			const errorData = {
				title,
				description,
				isNsfw,
			};

			let finalThumbnailImageUrls: string[] = [];
			let finalCollectionId: string | null = null;

			try {
				let thumbnailImageUrls: string[] = [];
				if (collectionThumbnail !== null) {
					const imageData = await applyCollectionImageTransformationPipeline(
						collectionThumbnail,
						isNsfw,
					);
					const { fileObjectIds, fileBuffers } = flattenImageBuffers([imageData]);
					thumbnailImageUrls = await uploadBatchToBucket(
						AWS_COLLECTION_PICTURE_BUCKET_NAME,
						'collections',
						fileBuffers,
						'webp',
						fileObjectIds,
					);
					finalThumbnailImageUrls = thumbnailImageUrls;
				}

				const newCollection = await createCollection({
					title,
					description,
					thumbnailImageUrls,
					isNsfw,
					authorId: event.locals.user.id,
				});
				finalCollectionId = newCollection.id;

				const cacheKey = getCacheKeyForGeneralCollectionPagination('createdAt', false, 0);
				invalidateCacheRemotely(cacheKey);

				return createSuccessResponse(
					handlerType,
					'Collection created successfully',
					{ newCollection },
					201,
				);
			} catch (error) {
				if (isRedirect(error)) throw error;

				logger.error(error);

				if (finalThumbnailImageUrls.length > 0) {
					deleteBatchFromBucket(AWS_COLLECTION_PICTURE_BUCKET_NAME, finalThumbnailImageUrls);
				}

				if (finalCollectionId) {
					deleteCollectionById(finalCollectionId, event.locals.user.id);
				}

				const message = 'An unexpected error occurred while creating the post';
				return createErrorResponse(
					handlerType,
					500,
					message,
					createCollectionFormErrorData(errorData, message),
				);
			}
		},
		true,
	);
};
