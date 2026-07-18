import { uploadToBucket } from '../../aws/actions/s3';
import { AWS_PROFILE_PICTURE_BUCKET_NAME } from '../../constants/aws';
import type { TMediaUploadStrategy } from './types';

export const profileMediaUploadStrategy: TMediaUploadStrategy = {
	resourceType: 'user-profiles',
	transformPreset: 'profile',
	destinationBucket: AWS_PROFILE_PICTURE_BUCKET_NAME,
	objectSource: 'profile_pictures',
	emitProgress: false,
	uploadFinals: async (transformed) => {
		const imageData = transformed[0];
		if (!imageData?.buffers.original) {
			throw new Error('Profile transform produced no image buffer');
		}

		const imageUrl = await uploadToBucket(
			AWS_PROFILE_PICTURE_BUCKET_NAME,
			'profile_pictures',
			imageData.buffers.original,
		);
		const objectId = imageUrl.split('/').pop() ?? '';

		return {
			imageUrls: [imageUrl],
			imageWidths: [imageData.metadata.original?.width ?? 0],
			imageHeights: [imageData.metadata.original?.height ?? 0],
			finalObjectKeys: objectId ? [`profile-pictures/${objectId}`] : [],
		};
	},
	toCompletionResult: ({ imageUrls, imageWidths, imageHeights, imageHashes }) => ({
		imageUrls,
		imageWidths,
		imageHeights,
		imageHashes,
	}),
};
