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

type TImageBuffers = {
	original: Buffer;
	nsfwPreview?: Buffer;
	preview?: Buffer;
};

export async function fileToSharp(file: File): Promise<Sharp> {
	const fileArrayBuffer = await file.arrayBuffer();
	const fileBuffer = Buffer.from(fileArrayBuffer);
	return sharp(fileBuffer);
}

export async function runProfileImageTransformationPipeline(file: File): Promise<Buffer> {
	const image = await fileToSharp(file);
	return image.webp(WEBP_OPTIONS).resize(PROFILE_PICTURE_WIDTH, PROFILE_PICTURE_HEIGHT).toBuffer();
}

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

async function runPostImageTransformationPipeline(
	file: File,
	isNsfw: boolean,
): Promise<TImageBuffers> {
	const buffers = {} as TImageBuffers;

	const image = await fileToSharp(file);

	const orignalImage = image.webp();
	const originalImageBuffer = await orignalImage.toBuffer();
	buffers.original = originalImageBuffer;

	const previewImage = applyPreviewResizer(orignalImage);
	const previewImageBuffer = await previewImage.toBuffer();
	buffers.preview = previewImageBuffer;

	if (isNsfw) {
		const nsfwPreviewBlurImage = applyBlurFilter(previewImage);
		const nsfwPreviewBlurImageBuffer = await nsfwPreviewBlurImage.toBuffer();
		buffers.nsfwPreview = nsfwPreviewBlurImageBuffer;
	}

	return buffers;
}

export function flattenPostImageBuffers(bufferMaps: TImageBuffers[]) {
	const fileBuffers: Buffer[] = [];
	const fileObjectIds: string[] = [];

	for (let i = 0; i < bufferMaps.length; i++) {
		const bufferMap = bufferMaps[i];
		for (const [imageTypeKey, imageBuffer] of Object.entries(bufferMap)) {
			const imageType = imageTypeKey as keyof TImageBuffers;
			let fileObjectId = crypto.randomUUID();

			switch (imageType) {
				case 'nsfwPreview':
					fileObjectId += NSFW_PREVIEW_IMAGE_SUFFIX;
					break;
				case 'preview':
					fileObjectId += PREVIEW_IMAGE_SUFFIX;
					break;
				case 'original':
					fileObjectId += ORIGINAL_IMAGE_SUFFIX;
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
	};
}

export async function runPostImageTransformationPipelineInBatch(
	files: File[],
	isNsfw: boolean = false,
): Promise<TImageBuffers[]> {
	const postImagePipelinePromises = files.map((file) =>
		runPostImageTransformationPipeline(file, isNsfw),
	);
	return await Promise.all(postImagePipelinePromises);
}
