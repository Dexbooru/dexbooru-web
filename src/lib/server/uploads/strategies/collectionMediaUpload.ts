import { uploadBatchToBucket } from '../../aws/actions/s3';
import { AWS_COLLECTION_PICTURE_BUCKET_NAME } from '../../constants/aws';
import { flattenImageBuffers } from '../../helpers/images';
import type { TMediaUploadStrategy } from './types';

export const collectionMediaUploadStrategy: TMediaUploadStrategy = {
	resourceType: 'collections',
	transformPreset: 'collection',
	destinationBucket: AWS_COLLECTION_PICTURE_BUCKET_NAME,
	objectSource: 'collections',
	emitProgress: false,
	uploadFinals: async (transformed) => {
		const { fileObjectIds, fileBuffers, imageWidths, imageHeights } =
			flattenImageBuffers(transformed);
		const imageUrls = await uploadBatchToBucket(
			AWS_COLLECTION_PICTURE_BUCKET_NAME,
			'collections',
			fileBuffers,
			'webp',
			fileObjectIds,
		);
		return {
			imageUrls,
			imageWidths,
			imageHeights,
			finalObjectKeys: fileObjectIds.map((objectId) => `collections/${objectId}`),
		};
	},
	toCompletionResult: ({ imageUrls, imageWidths, imageHeights, imageHashes }) => ({
		imageUrls,
		imageWidths,
		imageHeights,
		imageHashes,
	}),
};
