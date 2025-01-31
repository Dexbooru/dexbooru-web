export const getLabelLetterCacheKey = (
	labelType: 'tags' | 'artists',
	pageNumber: number,
	label: string,
) => {
	return `${labelType}-${label}-${pageNumber}`;
};
