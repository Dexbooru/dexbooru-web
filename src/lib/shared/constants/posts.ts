import type { TPost } from '../types/posts';

export const MAXIMUM_SOURCE_LINK_LENGTH = 450;
export const MAXIMUM_POSTS_PER_PAGE = 27;
export const MAXIMUM_TAGS_PER_POST = 20;
export const MAXIMUM_ARTISTS_PER_POST = 5;
export const MAXIMUM_POST_DESCRIPTION_LENGTH = 500;
export const EMPTY_POST: TPost = {
	id: '',
	likes: 0,
	views: 0,
	author: {
		id: '',
		username: '',
		profilePictureUrl: '',
	},
	commentCount: 0,
	authorId: '',
	description: '',
	imageUrls: [],
	imageHeights: [],
	imageWidths: [],
	artists: [],
	tags: [],
	isNsfw: false,
	createdAt: new Date(),
	updatedAt: new Date(),
	moderationStatus: 'PENDING',
};
