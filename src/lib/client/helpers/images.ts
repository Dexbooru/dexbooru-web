import { isFileImage } from '$lib/shared/helpers/images';
import { IMAGE_TO_SCREEN_RATIO_THRESHOLD } from '../constants/images';

type TImageDism = { imageWidth: number; imageHeight: number };

export const computeDownScaledImageRatios = (dimsA: TImageDism[], dimsB: TImageDism[]) => {
	const ratios: number[] = [];

	for (let i = 0; i < dimsA.length; i++) {
		const { imageWidth: imageWidthA, imageHeight: imageHeightA } = dimsA[i];
		const { imageWidth: imageWidthB, imageHeight: imageHeightB } = dimsB[i];

		if (!imageWidthB || !imageHeightB || imageWidthB === 0 || imageHeightB === 0) {
			ratios.push(100);
			continue;
		}

		const ratio = (imageWidthA * imageHeightA) / (imageWidthB * imageHeightB);
		ratios.push(Math.floor(ratio * 100));
	}

	return ratios;
};

export const transformImageDimensions = (
	imageWidth: number,
	imageHeight: number,
	screenWidth: number,
	screenHeight: number,
) => {
	if (screenWidth === 0 || screenHeight === 0 || !imageWidth || !imageHeight)
		return { imageWidth, imageHeight };

	const screenArea = screenWidth * screenHeight;
	const imageArea = imageWidth * imageHeight;
	const imageToScreenRatio = imageArea / screenArea;

	if (imageToScreenRatio >= IMAGE_TO_SCREEN_RATIO_THRESHOLD) {
		const widthRatio = (screenWidth * IMAGE_TO_SCREEN_RATIO_THRESHOLD) / imageWidth;
		const heightRatio = (screenHeight * IMAGE_TO_SCREEN_RATIO_THRESHOLD) / imageHeight;
		const scalingFactor = Math.min(widthRatio, heightRatio);

		return {
			imageWidth: Math.floor(imageWidth * scalingFactor),
			imageHeight: Math.floor(imageHeight * scalingFactor),
		};
	}

	return {
		imageWidth,
		imageHeight,
	};
};

export function urlIsImage(sourceUrl: string): Promise<boolean> {
	return new Promise((resolve) => {
		const img = new Image();

		img.onload = () => {
			resolve(true);
		};

		img.onerror = () => {
			resolve(false);
		};

		img.src = sourceUrl;
	});
}

export async function filesToBase64Strings(
	files: File[],
): Promise<{ failedFiles: string[]; results: { imageBase64: string; file: File }[] }> {
	const imageTransformationResults = await Promise.allSettled(
		files.map((file) => {
			return new Promise((resolve, reject) => {
				fileToBase64String(file)
					.then((value) => {
						resolve({ imageBase64: value, file });
					})
					.catch(() => {
						reject(new Error(file.name));
					});
			});
		}),
	);

	const failedFiles: string[] = [];
	const results: { imageBase64: string; file: File }[] = [];
	for (let i = 0; i < imageTransformationResults.length; i++) {
		if (imageTransformationResults[i].status === 'rejected') {
			const convertedImageTransformationResult = imageTransformationResults[i] as {
				reason: Error;
				status: string;
			};
			failedFiles.push(convertedImageTransformationResult.reason.message ?? '');
		} else {
			const convertedImageTransformationResult = imageTransformationResults[i] as {
				value: { imageBase64: string; file: File };
				status: string;
			};
			results.push(convertedImageTransformationResult.value);
		}
	}

	return {
		failedFiles,
		results,
	};
}

export function fileToBase64String(file: File): Promise<string | null> {
	return new Promise((resolve, reject) => {
		if (!file) {
			reject('Invalid file object');
		}

		if (!isFileImage(file)) {
			reject('Not an image file');
		}

		const reader = new FileReader();

		reader.onload = (event) => {
			setTimeout(() => {
				if (
					event.target &&
					typeof event.target.result === 'string' &&
					event.target.result.length > 0
				) {
					resolve(event.target.result);
				} else {
					reject('Error reading file as base64');
				}
			}, 1500);
		};

		reader.onerror = (error) => {
			reject(error);
		};

		reader.readAsDataURL(file);
	});
}
