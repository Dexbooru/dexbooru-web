import type { WebpOptions } from 'sharp';

export const WEBP_QUALITY = 85;
export const WEBP_OPTIONS: WebpOptions = {
	quality: WEBP_QUALITY,
	lossless: true,
};
