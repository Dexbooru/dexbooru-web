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
	const postImageHashes = await Promise.all(postPictures.map((file) => hashFile(file)));

	if (uploadId) {
		uploadStatusEmitter.emit(uploadId, 'Processing images...');
	}
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
	const postImageUrls = await uploadBatchToBucket(
		AWS_POST_PICTURE_BUCKET_NAME,
		'posts',
		postImageFileBuffers,
		'webp',
		fileObjectIds,
	);

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
