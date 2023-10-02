import { WEBP_OPTIONS, fileToSharp } from '$lib/helpers/images';


export const PROFILE_PICTURE_WIDTH = 128;
export const PROFILE_PICTURE_HEIGHT = 128;

export async function runProfileImageTransformationPipeline(file: File): Promise<Buffer> {
	const image = await fileToSharp(file);
	return image.webp(WEBP_OPTIONS).resize(PROFILE_PICTURE_WIDTH, PROFILE_PICTURE_HEIGHT).toBuffer();
}

async function runPostImageTransformationPipeline(file: File): Promise<Buffer> {
	const image = await fileToSharp(file);
	return image.webp(WEBP_OPTIONS).toBuffer();
}

export async function runPostImageTransformationPipelineInBatch(
	files: File[]
): Promise<Buffer[]> {
	const postImagePipelinePromises = files.map((file) =>
		runPostImageTransformationPipeline(file)
	);
	return await Promise.all(postImagePipelinePromises);
}
