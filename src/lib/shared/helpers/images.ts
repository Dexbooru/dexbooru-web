import {
	FILE_IMAGE_REGEX,
	MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB,
	MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB,
	MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB,
} from '../constants/images';

const IMAGE_SIZES: Record<'post' | 'profilePicture' | 'collection', number> = {
	collection: MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB,
	post: MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB,
	profilePicture: MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB,
};

export function isFileImageSmall(file: File, imageType: keyof typeof IMAGE_SIZES): boolean {
	const fileSizeMb = file.size / 1000 / 1000;
	const threshold = IMAGE_SIZES[imageType];
	return fileSizeMb <= threshold;
}

export function isFileImage(file: File): boolean {
	return FILE_IMAGE_REGEX.test(file.type);
}
