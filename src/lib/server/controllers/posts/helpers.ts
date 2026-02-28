import { uploadStatusEmitter } from '$lib/server/events/uploadStatus';
import { createErrorResponse } from '../../helpers/controllers';
import {
	hashFile,
	runPostImageTransformationPipelineInBatch,
	flattenImageBuffers,
} from '../../helpers/images';
import { uploadBatchToBucket } from '../../aws/actions/s3';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../../constants/aws';
import type { TControllerHandlerVariant } from '../../types/controllers';
import logger from '../../logging/logger';

export const throwPostNotFoundError = (handlerType: TControllerHandlerVariant, postId: string) => {
	const errorResponse = createErrorResponse(
		handlerType,
		404,
		`A post with the following id: ${postId} does not exist`,
	);
	if (handlerType === 'page-server-load') throw errorResponse;
	return errorResponse;
};

export const uploadPostImages = async (
	postPictures: File[],
	isNsfw: boolean,
	uploadId?: string,
) => {
	if (uploadId) {
		uploadStatusEmitter.emit(uploadId, 'Hashing original files...');
	}
	logger.info('Hashing post images...', { uploadId, count: postPictures.length });
	const postImageHashes = await Promise.all(postPictures.map((file) => hashFile(file)));

	if (uploadId) {
		uploadStatusEmitter.emit(uploadId, 'Processing images...');
	}
	logger.info('Running image transformation pipeline...', { uploadId });
	const postImageBufferMaps = await runPostImageTransformationPipelineInBatch(postPictures, isNsfw);
	const {
		fileObjectIds,
		fileBuffers: postImageFileBuffers,
		imageHeights: postImageHeights,
		imageWidths: postImageWidths,
	} = flattenImageBuffers(postImageBufferMaps);

	if (uploadId) {
		uploadStatusEmitter.emit(uploadId, 'Uploading images to server...');
	}
	logger.info('Uploading processed images to S3...', {
		uploadId,
		bucket: AWS_POST_PICTURE_BUCKET_NAME,
		imageCount: postImageFileBuffers.length,
	});
	const postImageUrls = await uploadBatchToBucket(
		AWS_POST_PICTURE_BUCKET_NAME,
		'posts',
		postImageFileBuffers,
		'webp',
		fileObjectIds,
	);
	logger.info('Successfully uploaded images to S3', { uploadId, urls: postImageUrls });

	return {
		postImageUrls,
		postImageHeights,
		postImageWidths,
		postImageHashes,
	};
};

export const createPostFormErrorData = (errorData: Record<string, unknown>, message: string) => {
	return {
		...errorData,
		reason: message,
	};
};
