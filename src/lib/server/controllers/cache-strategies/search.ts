import type { TPostOrderByColumn } from '$lib/shared/types/posts';

export const getCacheKeyAdvanced = (
	query: string,
	limit: number,
	pageNumber: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
) => {
	return `${query}-${limit}-${pageNumber}-${orderBy}-${ascending}`;
};

export const getCacheKeyGeneral = (query: string, searchSection: string, limit: number) => {
	return `${query}-${searchSection}-${limit}`;
};

export const CACHE_TIME_RESULTS_SECONDS = 60;
export const CACHE_TIME_NO_RESULTS_SECONDS = 300;
