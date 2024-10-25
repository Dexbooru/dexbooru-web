// this array exists only as a "lazy" flag to prevent seeded danbooru images from getting filtered in the UI in dev mode
export const IMAGE_FILTER_EXCLUSION_BASE_URLS = ['https://testbooru-cdn.donmai.us'];

export const ORIGINAL_IMAGE_SUFFIX = '_original';
export const PREVIEW_IMAGE_SUFFIX = '_preview';
export const NSFW_PREVIEW_IMAGE_SUFFIX = '_nsfw_preview';

export const COLLECTION_THUMBNAIL_WIDTH = 600;
export const COLLECTION_THUMBNAIL_HEIGHT = 500;
export const POST_PICTURE_PREVIEW_WIDTH = 350;
export const POST_PICTURE_PREVIEW_HEIGHT = 350;
export const PROFILE_PICTURE_WIDTH = 128;
export const PROFILE_PICTURE_HEIGHT = 128;

export const FILE_IMAGE_REGEX = /^image\/(jpeg|jpg|webp|png|gif|bmp)$/;
export const FILE_IMAGE_ACCEPT = [
	'image/png',
	'image/jpeg',
	'image/jpg',
	'image/webp',
	'image/gif',
];

export const MAXIMUM_COLLECTION_THUMBNAIL_SIZE_MB = 3.5;
export const MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB = 3.5;
export const MAXIMUM_PROFILE_PICTURE_IMAGE_UPLOAD_SIZE_MB = 1.75;

export const MAXIMUM_IMAGES_PER_POST = 3;
