import DefaultPostPicture from '$lib/client/assets/default_post_picture.webp';
import DefaultProfilePicture from '$lib/client/assets/default_profile_picture.webp';

export const LAZY_LOADABLE_IMAGES = [
	'booru-avatar',
	'booru-avatar-collection-card',
	'booru-avatar-navbar',
	'booru-avatar-search-table-posts',
	'booru-avatar-search-table-collections',
	'booru-avatar-search-table-users',
	'booru-avatar-profile-card',
	'booru-avatar-post-card',
	'post-carousel-image',
	'collection-carousel-image',
	'collection-preview-image',
	'whole-post-image',
];
export const LAZY_LOADABLE_IMAGE_DEFAULT_MAP = {
	'booru-avatar-collection-card': DefaultProfilePicture,
	'booru-avatar-search-table-posts': DefaultProfilePicture,
	'booru-avatar-search-table-collections': DefaultProfilePicture,
	'booru-avatar-search-table-users': DefaultProfilePicture,
	'booru-avatar-profile-card': DefaultProfilePicture,
	'booru-avatar-navbar': DefaultProfilePicture,
	'booru-avatar-post-card': DefaultProfilePicture,
	'booru-avatar': DefaultProfilePicture,
	'post-carousel-image': DefaultPostPicture,
	'collection-carousel-image': DefaultPostPicture,
	'whole-post-image': DefaultPostPicture,
	'collection-preview-image': DefaultPostPicture,
};
