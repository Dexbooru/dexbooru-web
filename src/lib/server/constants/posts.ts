import type { TPostLikeAction, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';

export const VALID_ORDERBY_COLUMNS: TPostOrderByColumn[] = ['createdAt', 'likes', 'views'];

export const POST_LIKE_ACTIONS: TPostLikeAction[] = ['like', 'dislike'];

export const PUBLIC_POST_SELECTORS: TPostSelector = {
	id: true,
	sourceLink: true,
	description: true,
	isNsfw: true,
	createdAt: true,
	imageUrls: true,
	imageHeights: true,
	imageWidths: true,
	likes: true,
	views: true,
	commentCount: true,
	author: {
		select: {
			id: true,
			username: true,
			profilePictureUrl: true,
		},
	},
	artistString: true,
	tagString: true,
	tags: false,
	artists: false,
};

export const PAGE_SERVER_LOAD_POST_SELECTORS: TPostSelector = {
	...PUBLIC_POST_SELECTORS,
	sourceLink: false,
	description: false,
	likes: false,
	views: false,
	commentCount: false,
	createdAt: false,
	author: false,
	authorId: false,
	imageHeights: false,
	imageWidths: false,
	tagString: true,
	artistString: true,
	tags: false,
	artists: false,
};
