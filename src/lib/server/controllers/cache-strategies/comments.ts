import type { TCommentOrderByColumn } from '$lib/shared/types/comments';

export const getCacheKeysForIndividualCommentKeys = (commentId: string) => {
	return `commentkeys-${commentId}`;
};

export const getCacheKeyWithCategory = (
	pageNumber: number,
	orderBy: TCommentOrderByColumn,
	ascending: boolean,
) => {
	return `comments-${pageNumber}-${orderBy}-${ascending}`;
};

export const CACHE_TIME_CATEGORY_COMMENTS = 25;
