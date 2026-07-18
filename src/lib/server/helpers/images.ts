import {
	NSFW_PREVIEW_IMAGE_SUFFIX,
	ORIGINAL_IMAGE_SUFFIX,
	PREVIEW_IMAGE_SUFFIX,
} from '$lib/shared/constants/images';
import crypto from 'node:crypto';
import type { TImageData } from '../types/images';
import { transformPostImageFromFile } from './images/presets';

export { ImageTransformationBuilder } from './images/imageTransformationBuilder';
export {
	transformCollectionThumbnail,
	transformCollectionThumbnailFromFile,
	transformDefaultProfilePicture,
	transformPostImage,
	transformPostImageFromFile,
	transformProfilePicture,
	transformProfilePictureFromFile,
} from './images/presets';

export function hashImageBuffer(buffer: Buffer): string {
	return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function hashFile(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	return crypto.createHash('sha256').update(Buffer.from(arrayBuffer)).digest('hex');
}

export function flattenImageBuffers(bufferMaps: TImageData[]) {
	const fileBuffers: Buffer[] = [];
	const fileObjectIds: string[] = [];
	const imageWidths: number[] = [];
	const imageHeights: number[] = [];
	const imageHashes: string[] = [];

	for (const bufferMap of bufferMaps) {
		const bufferMapObjectId = crypto.randomUUID();

		if (bufferMap.buffers.original) {
			imageHashes.push(hashImageBuffer(bufferMap.buffers.original));
		}

		for (const [imageTypeKey, imageBuffer] of Object.entries(bufferMap.buffers)) {
			const imageType = imageTypeKey as keyof TImageData['buffers'];
			let fileObjectId = bufferMapObjectId;

			switch (imageType) {
				case 'nsfwPreview':
					fileObjectId += NSFW_PREVIEW_IMAGE_SUFFIX;
					imageWidths.push(bufferMap.metadata.nsfwPreview?.width ?? 0);
					imageHeights.push(bufferMap.metadata.nsfwPreview?.height ?? 0);
					break;
				case 'preview':
					fileObjectId += PREVIEW_IMAGE_SUFFIX;
					imageWidths.push(bufferMap.metadata.preview?.width ?? 0);
					imageHeights.push(bufferMap.metadata.preview?.height ?? 0);
					break;
				case 'original':
					fileObjectId += ORIGINAL_IMAGE_SUFFIX;
					imageWidths.push(bufferMap.metadata.original?.width ?? 0);
					imageHeights.push(bufferMap.metadata.original?.height ?? 0);
					break;
				default:
					break;
			}

			fileBuffers.push(imageBuffer);
			fileObjectIds.push(fileObjectId);
		}
	}

	return {
		fileBuffers,
		fileObjectIds,
		imageWidths,
		imageHeights,
		imageHashes,
	};
}

export function base64ToFile(base64: string, fileName: string) {
	const base64String = base64.replace(/^data:image\/\w+;base64,/, '');
	const buffer = Buffer.from(base64String, 'base64');
	return new File([buffer], fileName, { type: 'image/png' });
}

export async function runPostImageTransformationPipelineInBatch(
	files: File[],
	isNsfw: boolean = false,
): Promise<TImageData[]> {
	return await Promise.all(files.map((file) => transformPostImageFromFile(file, isNsfw)));
}
