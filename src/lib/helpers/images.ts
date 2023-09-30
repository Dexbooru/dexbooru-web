import sharp from 'sharp';
import type { WebpOptions } from 'sharp';

type IMAGE_TYPE = 'webp' | 'jpg' | 'jpeg' | 'png';

const VALID_IMAGE_TYPES: IMAGE_TYPE[] = ['webp', 'jpeg', 'jpg', 'png'];
const WEBP_QUALITY = 85;
const WEBP_OPTIONS: WebpOptions = {
	quality: WEBP_QUALITY,
	lossless: true
};

export async function compressImage(
	imageBuffer: Buffer,
	outputFileType: IMAGE_TYPE
): Promise<Buffer | null> {
	if (!VALID_IMAGE_TYPES.includes(outputFileType)) {
		return null;
	}

	try {
		const image = sharp(imageBuffer);
		const convertedImage = image.webp(WEBP_OPTIONS);
		return await convertedImage.toBuffer();
	} catch (error) {
		return null;
	}
}
