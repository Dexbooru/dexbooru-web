import type { TPostOrderByColumn } from '$lib/shared/types/posts';

export const getCacheKeyAdvanced = (
	query: string,
	limit: number,
	pageNumber: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	includeRejectedPosts: boolean,
) => {
	return `${query}-${limit}-${pageNumber}-${orderBy}-${ascending}-${includeRejectedPosts ? 'moderation' : 'public'}`;
};

export const getCacheKeyGeneral = (
	query: string,
	searchSection: string,
	limit: number,
	includeRejectedPosts: boolean,
) => {
	return `${query}-${searchSection}-${limit}-${includeRejectedPosts ? 'moderation' : 'public'}`;
};

export const CACHE_TIME_RESULTS_SECONDS = 60;
export const CACHE_TIME_NO_RESULTS_SECONDS = 300;
