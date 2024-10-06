import { isFileImage } from '$lib/shared/helpers/images';

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
