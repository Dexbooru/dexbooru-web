import { uploadBatchToBucket } from '../../aws/actions/s3';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../../constants/aws';
import { flattenImageBuffers } from '../../helpers/images';
import type { TMediaUploadStrategy } from './types';

export const postMediaUploadStrategy: TMediaUploadStrategy = {
	resourceType: 'posts',
	transformPreset: 'post',
	destinationBucket: AWS_POST_PICTURE_BUCKET_NAME,
	objectSource: 'posts',
	emitProgress: true,
	uploadFinals: async (transformed) => {
		const { fileObjectIds, fileBuffers, imageWidths, imageHeights } =
			flattenImageBuffers(transformed);
		const imageUrls = await uploadBatchToBucket(
			AWS_POST_PICTURE_BUCKET_NAME,
			'posts',
			fileBuffers,
			'webp',
			fileObjectIds,
		);
		return {
			imageUrls,
			imageWidths,
			imageHeights,
			finalObjectKeys: fileObjectIds.map((objectId) => `posts/${objectId}`),
		};
	},
	toCompletionResult: ({ imageUrls, imageWidths, imageHeights, imageHashes }) => ({
		imageUrls,
		imageWidths,
		imageHeights,
		imageHashes,
	}),
};
