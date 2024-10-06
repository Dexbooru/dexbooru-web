import { MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB, FILE_IMAGE_REGEX } from '../constants/images';

export function isFileImageSmall(file: File): boolean {
	const fileSizeMb = file.size / 1000 / 1000;
	return fileSizeMb <= MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB;
}

export function isFileImage(file: File): boolean {
	return FILE_IMAGE_REGEX.test(file.type);
}
