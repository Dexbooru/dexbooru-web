import type { TPost } from '../types/posts';

export const MAXIMUM_SOURCE_LINK_LENGTH = 450;
export const MAXIMUM_POSTS_PER_PAGE = 27;
export const MAXIMUM_SIMILAR_POSTS_PER_POST = 6;
export const MAXIMUM_TAGS_PER_POST = 20;
export const MAXIMUM_ARTISTS_PER_POST = 5;
export const MAXIMUM_POST_DESCRIPTION_LENGTH = 500;
export const MAXIMUM_COMMENTS_PER_POST = 100;
export const EMPTY_POST: TPost = {
	id: '',
	likes: 0,
	views: 0,
	author: {
		id: '',
		username: '',
		profilePictureUrl: '',
		role: 'USER',
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
	sourceLink: '',
	moderationStatus: 'PENDING',
	tagString: '',
	artistString: '',
	comments: [],
};

export const POST_SOURCE_TYPES = ['VIDEOGAME', 'ANIME', 'MANGA', 'OTHER'] as const;