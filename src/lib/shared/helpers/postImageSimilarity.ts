import type { PostImageSimilarityResult } from '../types/postImageSimilarity';

export function sortSimilarityResultsByCreatedAtDesc(
	results: PostImageSimilarityResult[],
): PostImageSimilarityResult[] {
	return [...results].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}
