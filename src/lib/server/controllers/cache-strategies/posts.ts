import type { TPostFetchCategory } from '$lib/server/types/controllers';
import type { TPostOrderByColumn } from '$lib/shared/types/posts';
import { createHash } from 'node:crypto';

export const getCacheKeyForIndividualPostKeys = (postId: string) => {
	return `postkeys-${postId}`;
};

export const getCacheKeyForIndividualPost = (postId: string) => {
	return `post-${postId}`;
};

const buildPreferenceHash = (values: string[]) => {
	const normalized = values
		.map((value) => value.trim().toLowerCase())
		.filter((value) => value.length > 0)
		.toSorted()
		.join(',');
	return createHash('sha1').update(normalized).digest('hex').slice(0, 12);
};

export const getCacheKeyForPostSimilarity = (
	postId: string,
	userId: string | null,
	preferences: {
		browseInSafeMode: boolean;
		blacklistedTags: string[];
		blacklistedArtists: string[];
	},
) => {
	const tagHash = buildPreferenceHash(preferences.blacklistedTags);
	const artistHash = buildPreferenceHash(preferences.blacklistedArtists);
	const safeModeKey = preferences.browseInSafeMode ? 'safe' : 'all';
	const userKey = userId ?? 'anon';
	return `post-similar-${postId}-${userKey}-${safeModeKey}-${tagHash}-${artistHash}`;
};

export const getCacheKeyWithPostCategoryWithLabel = (
	type: 'artist' | 'tag' | 'character' | 'source',
	name: string,
	pageNumber: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
) => {
	if (type === 'artist') {
		return `artist-${name}-${pageNumber}-${orderBy}-${ascending}`;
	}
	if (type === 'tag') {
		return `post-tag-${name}-${pageNumber}-${orderBy}-${ascending}`;
	}
	if (type === 'character') {
		return `character-${name}-${pageNumber}-${orderBy}-${ascending}`;
	}
	return `source-${name}-${pageNumber}-${orderBy}-${ascending}`;
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
	userId: string | null = null,
) => {
	if (userId === null) {
		return `post-${category}-${pageNumber}-${orderBy}-${ascending}`;
	}
	return `post-${category}-${pageNumber}-${orderBy}-${ascending}-${userId}`;
};

export const CACHE_TIME_GENERAL_POSTS = 60;
export const CACHE_TIME_TAG_POSTS = 60;
export const CACHE_TIME_ARTIST_POSTS = 120;
export const CACHE_TIME_CHARACTER_POSTS = 120;
export const CACHE_TIME_SOURCE_POSTS = 120;
export const CACHE_TIME_INDIVIDUAL_POST_FOUND = 120;
export const CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND = CACHE_TIME_INDIVIDUAL_POST_FOUND * 5;
export const CACHE_TIME_INDIVIDUAL_POST_SIMILARITY = 300;
