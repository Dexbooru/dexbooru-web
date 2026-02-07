import type {
	TPostLikeAction,
	TPostOrderByColumn,
	TPostSelector,
	TPostSourceSelector,
} from '$lib/shared/types/posts';

export const VALID_ORDERBY_COLUMNS: TPostOrderByColumn[] = ['createdAt', 'likes', 'views'];

export const POST_LIKE_ACTIONS: TPostLikeAction[] = ['like', 'dislike'];

export const PUBLIC_POST_SOURCE_SELECTORS: TPostSourceSelector = {
	characterName: true,
	sourceTitle: true,
	sourceType: true,
};

export const PUBLIC_POST_SELECTORS: TPostSelector = {
	id: true,
	sourceLink: true,
	description: true,
	isNsfw: true,
	createdAt: true,
	moderationStatus: true,
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
	moderationStatus: true,
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

export const MAXIMUM_DUPLICATES_TO_SEARCH_ON_POST_UPLOAD = 2;
