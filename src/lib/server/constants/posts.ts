import type { TPostLikeAction, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';

export const VALID_ORDERBY_COLUMNS: TPostOrderByColumn[] = ['createdAt', 'likes', 'views'];

export const POST_LIKE_ACTIONS: TPostLikeAction[] = ['like', 'dislike'] as const;

export const MAXIMUM_POSTS_PER_PAGE = 27;
export const PUBLIC_POST_SELECTORS: TPostSelector = {
	id: true,
	description: true,
	isNsfw: true,
	createdAt: true,
	imageUrls: true,
	likes: true,
	views: true,
	author: {
		select: {
			id: true,
			username: true,
			profilePictureUrl: true
		}
	},
	tags: {
		select: {
			name: true
		}
	},
	artists: {
		select: {
			name: true
		}
	}
};
