import type { TPostFetchCategory } from '$lib/server/types/controllers';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';

export const getCacheKeyForIndividualPostKeys = (postId: string) => {
	return `postkeys-${postId}`;
};

export const getCacheKeyForIndividualPost = (postId: string) => {
	return `post-${postId}`;
};

export const getCacheKeyWithPostCategoryWithLabel = (
	type: 'artist' | 'tag',
	name: string,
	pageNumber: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
) => {
	if (type === 'artist') {
		return `artist-${name}-${pageNumber}-${orderBy}-${ascending}`;
	}
	return `post-tag-${name}-${pageNumber}-${orderBy}-${ascending}`;
};

export const getCacheKeyForPostAuthor = (
	username: string,
	pageNumber: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
) => {
	return `post-author-${username}-${pageNumber}-${orderBy}-${ascending}`;
};

export const getCacheKeyWithPostCategory = (
	category: TPostFetchCategory,
	pageNumber: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
) => {
	return `post-${category}-${pageNumber}-${orderBy}-${ascending}`;
};

export const CACHE_TIME_GENERAL_POSTS = 60;
export const CACHE_TIME_TAG_POSTS = 60;
export const CACHE_TIME_ARTIST_POSTS = 120;
export const CACHE_TIME_INDIVIDUAL_POST_FOUND = 120;
export const CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND = CACHE_TIME_INDIVIDUAL_POST_FOUND * 5;
