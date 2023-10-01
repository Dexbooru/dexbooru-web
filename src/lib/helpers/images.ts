import sharp from 'sharp';
import type { WebpOptions } from 'sharp';

const WEBP_QUALITY = 85;
const WEBP_OPTIONS: WebpOptions = {
	quality: WEBP_QUALITY,
	lossless: true
};

export const PROFILE_PICTURE_WIDTH = 128;
export const PROFILE_PICTURE_HEIGHT = 128;

export async function fileToBuffer(file: File): Promise<Buffer> {
	const fileArrayBuffer = await file.arrayBuffer();
	return Buffer.from(fileArrayBuffer);
}

export async function compressImage(imageBuffer: Buffer): Promise<Buffer | null> {
	try {
		const image = sharp(imageBuffer);
		const convertedImage = image.webp(WEBP_OPTIONS);
		return await convertedImage.toBuffer();
	} catch (error) {
		return null;
	}
}

export async function resizeImage(
	imageBuffer: Buffer,
	width: number,
	height: number
): Promise<Buffer | null> {
	try {
		const image = sharp(imageBuffer);
		const resizedImage = image.resize(width, height);
		return await resizedImage.toBuffer();
	} catch (error) {
		return null;
	}
}
