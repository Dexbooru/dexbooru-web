import type { WebpOptions } from 'sharp';

export const WEBP_QUALITY = 95;
export const WEBP_OPTIONS: WebpOptions = {
	quality: WEBP_QUALITY,
	lossless: true,
};
