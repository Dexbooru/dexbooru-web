import type { WebpOptions } from 'sharp';

export const PROFILE_PICTURE_WIDTH = 128;
export const PROFILE_PICTURE_HEIGHT = 128;
export const FILE_IMAGE_REGEX = /^image\/(jpeg|jpg|webp|png|gif|bmp)$/;
export const MAXIMUM_IMAGE_UPLOAD_SIZE_MB = 1.75;
export const MAXIMUM_IMAGES_PER_POST = 3;
export const WEBP_QUALITY = 85;
export const WEBP_OPTIONS: WebpOptions = {
	quality: WEBP_QUALITY,
	lossless: true
};
