export const getLabelLetterCacheKey = (
	labelType: 'tags' | 'artists',
	pageNumber: number,
	label: string,
) => {
	return `${labelType}-${label}-${pageNumber}`;
};

export const TAGS_PAGINATION_CACHE_TIME_SECONDS = 30;
export const ARTISTS_PAGINATION_CACHE_TIME_SECONDS = 30;
