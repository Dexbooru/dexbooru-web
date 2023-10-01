import sharp from 'sharp';
import type { WebpOptions } from 'sharp';

const WEBP_QUALITY = 85;
const WEBP_OPTIONS: WebpOptions = {
	quality: WEBP_QUALITY,
	lossless: true
};

const FILE_IMAGE_REGEX = /^image\/(jpeg|jpg|png|gif|bmp)$/;
export const PROFILE_PICTURE_WIDTH = 128;
export const PROFILE_PICTURE_HEIGHT = 128;
export const MAXIMUM_IMAGE_UPLOAD_SIZE_MB = 1.75;


export function isImageSmall(file: File): boolean {
	const fileSizeMb = file.size / 1000 / 1000;
	return fileSizeMb <= MAXIMUM_IMAGE_UPLOAD_SIZE_MB;
}

export function isFileImage(file: File): boolean {
	return FILE_IMAGE_REGEX.test(file.type);
}

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
