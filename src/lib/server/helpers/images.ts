import {
	COLLECTION_THUMBNAIL_HEIGHT,
	COLLECTION_THUMBNAIL_WIDTH,
	NSFW_PREVIEW_IMAGE_SUFFIX,
	ORIGINAL_IMAGE_SUFFIX,
	POST_PICTURE_PREVIEW_HEIGHT,
	POST_PICTURE_PREVIEW_WIDTH,
	PREVIEW_IMAGE_SUFFIX,
	PROFILE_PICTURE_HEIGHT,
	PROFILE_PICTURE_WIDTH,
} from '$lib/shared/constants/images';
import type { ResizeOptions, Sharp } from 'sharp';
import sharp from 'sharp';
import { WEBP_OPTIONS } from '../constants/images';
import type { TImageData, TImageMetadata } from '../types/images';

const getImageResizeOptions = (width: number, height: number) => {
	return {
		width,
		height,
		fit: 'contain',
		background: { r: 0, g: 0, b: 0, alpha: 0 },
	} as ResizeOptions;
};

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

export async function fileToSharp(file: File): Promise<Sharp> {
	const fileArrayBuffer = await file.arrayBuffer();
	const fileBuffer = Buffer.from(fileArrayBuffer);
	return sharp(fileBuffer);
}

export async function runProfileImageTransformationPipeline(file: File): Promise<Buffer> {
	const image = await fileToSharp(file);
	return image
		.webp(WEBP_OPTIONS)
		.resize(getImageResizeOptions(PROFILE_PICTURE_WIDTH, PROFILE_PICTURE_HEIGHT))
		.toBuffer();
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

	const originalImage = image.webp(WEBP_OPTIONS);
	const originalImageBuffer = await originalImage.toBuffer();
	imageData.buffers.original = originalImageBuffer;
	imageData.metadata.original = await getImageMeta(originalImage);

	const previewImage = originalImage.resize(
		getImageResizeOptions(POST_PICTURE_PREVIEW_WIDTH, POST_PICTURE_PREVIEW_HEIGHT),
	);
	const previewImageBuffer = await previewImage.toBuffer();
	imageData.buffers.preview = previewImageBuffer;
	imageData.metadata.preview = await getImageMeta(previewImage);

	if (isNsfw) {
		const nsfwPreviewBlurImage = applyBlurFilter(previewImage);
		const nsfwPreviewBlurImageBuffer = await nsfwPreviewBlurImage.toBuffer();
		imageData.buffers.nsfwPreview = nsfwPreviewBlurImageBuffer;
		imageData.metadata.nsfwPreview = await getImageMeta(nsfwPreviewBlurImage);
	}

	return imageData;
}

export async function applyCollectionImageTransformationPipeline(file: File, isNsfw: boolean) {
	const imageData = {
		buffers: {},
		metadata: {},
	} as TImageData;

	const image = await fileToSharp(file);

	const originalImage = image.webp(WEBP_OPTIONS);
	const originalImageBuffer = await originalImage.toBuffer();
	imageData.buffers.original = originalImageBuffer;
	imageData.metadata.original = await getImageMeta(originalImage);

	const resizeImage = originalImage.resize(
		getImageResizeOptions(COLLECTION_THUMBNAIL_WIDTH, COLLECTION_THUMBNAIL_HEIGHT),
	);
	const resizeImageBuffer = await resizeImage.toBuffer();
	imageData.buffers.preview = resizeImageBuffer;
	imageData.metadata.preview = await getImageMeta(resizeImage);

	if (isNsfw) {
		const nsfwImage = applyBlurFilter(resizeImage);
		const nsfwImageBuffer = await nsfwImage.toBuffer();
		imageData.buffers.nsfwPreview = nsfwImageBuffer;
		imageData.metadata.nsfwPreview = await getImageMeta(nsfwImage);
	}

	return imageData;
}

export function flattenImageBuffers(bufferMaps: TImageData[]) {
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
