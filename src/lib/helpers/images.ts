import sharp from 'sharp';
import type { WebpOptions } from 'sharp';


const WEBP_QUALITY = 85;
const WEBP_OPTIONS: WebpOptions = {
	quality: WEBP_QUALITY,
	lossless: true
};

export async function compressImage(imageBuffer: Buffer): Promise<Buffer | null> {
	try {
		const image = sharp(imageBuffer);
		const convertedImage = image.webp(WEBP_OPTIONS);
		return await convertedImage.toBuffer();
	} catch (error) {
		return null;
	}
}
