import type { TPostLikeAction, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';

export const VALID_ORDERBY_COLUMNS: TPostOrderByColumn[] = ['createdAt', 'likes', 'views'];

export const POST_LIKE_ACTIONS: TPostLikeAction[] = ['like', 'dislike'];


export const PUBLIC_POST_SELECTORS: TPostSelector = {
	id: true,
	description: true,
	isNsfw: true,
	createdAt: true,
	imageUrls: true,
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
	tags: {
		select: {
			id: true,
			name: true,
		},
	},
	artists: {
		select: {
			id: true,
			name: true,
		},
	},
};

export const PAGE_SERVER_LOAD_POST_SELECTORS: TPostSelector = {
	...PUBLIC_POST_SELECTORS,
	description: false,
	likes: false,
	views: false,
	commentCount: false,
	createdAt: false,
	author: false,
	authorId: false,
	tags: {
		select: {
			name: true,
		},
	},
	artists: {
		select: {
			name: true,
		},
	},
}