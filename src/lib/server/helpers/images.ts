import {
	NSFW_PREVIEW_IMAGE_SUFFIX,
	ORIGINAL_IMAGE_SUFFIX,
	POST_PICTURE_PREVIEW_HEIGHT,
	POST_PICTURE_PREVIEW_WIDTH,
	PREVIEW_IMAGE_SUFFIX,
	PROFILE_PICTURE_HEIGHT,
	PROFILE_PICTURE_WIDTH,
	WEBP_OPTIONS,
} from '$lib/shared/constants/images';
import type { Sharp } from 'sharp';
import sharp from 'sharp';
import type { TImageData, TImageMetadata } from '../types/images';

export async function fileToSharp(file: File): Promise<Sharp> {
	const fileArrayBuffer = await file.arrayBuffer();
	const fileBuffer = Buffer.from(fileArrayBuffer);
	return sharp(fileBuffer);
}

const getImageMeta = async (image: Sharp): Promise<TImageMetadata> => {
	const metadata = await image.metadata();
	return {
		width: metadata.width ?? 0,
		height: metadata.height ?? 0,
	};
};

function applyBlurFilter(image: Sharp, sigma: number = 40) {
	return image.blur(sigma);
}

function applyPreviewResizer(image: Sharp) {
	return image.resize({
		width: POST_PICTURE_PREVIEW_WIDTH,
		height: POST_PICTURE_PREVIEW_HEIGHT,
		fit: 'contain',
		background: { r: 0, g: 0, b: 0, alpha: 0 },
	});
}

export async function runProfileImageTransformationPipeline(file: File): Promise<Buffer> {
	const image = await fileToSharp(file);
	return image.webp(WEBP_OPTIONS).resize(PROFILE_PICTURE_WIDTH, PROFILE_PICTURE_HEIGHT).toBuffer();
}

async function runPostImageTransformationPipeline(
	file: File,
	isNsfw: boolean,
): Promise<TImageData> {
	const imageData = {
		buffers: {},
		metadata: {},
	} as TImageData;

	const image = await fileToSharp(file);

	const orignalImage = image.webp();
	const originalImageBuffer = await orignalImage.toBuffer();
	imageData.buffers.original = originalImageBuffer;
	imageData.metadata.original = await getImageMeta(orignalImage);

	const previewImage = applyPreviewResizer(orignalImage);
	const previewImageBuffer = await previewImage.toBuffer();
	imageData.buffers.preview = previewImageBuffer;
	imageData.metadata.preview = {
		width: POST_PICTURE_PREVIEW_WIDTH,
		height: POST_PICTURE_PREVIEW_HEIGHT,
	};

	if (isNsfw) {
		const nsfwPreviewBlurImage = applyBlurFilter(previewImage);
		const nsfwPreviewBlurImageBuffer = await nsfwPreviewBlurImage.toBuffer();
		imageData.buffers.nsfwPreview = nsfwPreviewBlurImageBuffer;
		imageData.metadata.nsfwPreview = {
			width: POST_PICTURE_PREVIEW_WIDTH,
			height: POST_PICTURE_PREVIEW_HEIGHT,
		};
	}

	return imageData;
}

export function flattenPostImageBuffers(bufferMaps: TImageData[]) {
	const fileBuffers: Buffer[] = [];
	const fileObjectIds: string[] = [];
	const imageWidths: number[] = [];
	const imageHeights: number[] = [];

	for (let i = 0; i < bufferMaps.length; i++) {
		const bufferMap = bufferMaps[i];
		for (const [imageTypeKey, imageBuffer] of Object.entries(bufferMap.buffers)) {
			const imageType = imageTypeKey as keyof TImageData['buffers'];
			let fileObjectId = crypto.randomUUID();

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
	};
}

export async function runPostImageTransformationPipelineInBatch(
	files: File[],
	isNsfw: boolean = false,
): Promise<TImageData[]> {
	const postImagePipelinePromises = files.map((file) =>
		runPostImageTransformationPipeline(file, isNsfw),
	);
	return await Promise.all(postImagePipelinePromises);
}
