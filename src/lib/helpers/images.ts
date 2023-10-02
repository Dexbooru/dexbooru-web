import sharp from 'sharp';
import type { Sharp, WebpOptions } from 'sharp';

const WEBP_QUALITY = 85;
export const WEBP_OPTIONS: WebpOptions = {
	quality: WEBP_QUALITY,
	lossless: true
};

const FILE_IMAGE_REGEX = /^image\/(jpeg|jpg|webp|png|gif|bmp)$/;
export const MAXIMUM_IMAGE_UPLOAD_SIZE_MB = 1.75;
export const MAXIMUM_IMAGES_PER_POST = 3;

export function isFileImageSmall(file: File): boolean {
	const fileSizeMb = file.size / 1000 / 1000;
	return fileSizeMb <= MAXIMUM_IMAGE_UPLOAD_SIZE_MB;
}

export function isFileImage(file: File): boolean {
	return FILE_IMAGE_REGEX.test(file.type);
}

export async function fileToSharp(file: File): Promise<Sharp> {
	const fileArrayBuffer = await file.arrayBuffer();
	const fileBuffer = Buffer.from(fileArrayBuffer);
	return sharp(fileBuffer);
}
