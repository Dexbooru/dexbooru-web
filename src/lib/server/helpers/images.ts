import sharp from 'sharp';
import type { Sharp } from 'sharp';
import {
	WEBP_OPTIONS,
	PROFILE_PICTURE_WIDTH,
	PROFILE_PICTURE_HEIGHT
} from '$lib/shared/constants/images';

export async function fileToSharp(file: File): Promise<Sharp> {
	const fileArrayBuffer = await file.arrayBuffer();
	const fileBuffer = Buffer.from(fileArrayBuffer);
	return sharp(fileBuffer);
}

export async function runProfileImageTransformationPipeline(file: File): Promise<Buffer> {
	const image = await fileToSharp(file);
	return image.webp(WEBP_OPTIONS).resize(PROFILE_PICTURE_WIDTH, PROFILE_PICTURE_HEIGHT).toBuffer();
}

async function runPostImageTransformationPipeline(file: File): Promise<Buffer> {
	const image = await fileToSharp(file);
	return image.webp(WEBP_OPTIONS).toBuffer();
}

export async function runPostImageTransformationPipelineInBatch(files: File[]): Promise<Buffer[]> {
	const postImagePipelinePromises = files.map((file) => runPostImageTransformationPipeline(file));
	return await Promise.all(postImagePipelinePromises);
}
