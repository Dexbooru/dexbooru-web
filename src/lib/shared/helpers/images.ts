import {
	FILE_IMAGE_REGEX,
	MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB,
	MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB,
} from '../constants/images';

export function isFileImageSmall(file: File, postFile: boolean = true): boolean {
	const fileSizeMb = file.size / 1000 / 1000;
	const threshold = postFile
		? MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB
		: MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB;
	return fileSizeMb <= threshold;
}

export function isFileImage(file: File): boolean {
	return FILE_IMAGE_REGEX.test(file.type);
}
