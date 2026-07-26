import { describe, expect, it } from 'vitest';
import { sortSimilarityResultsByCreatedAtDesc } from '$lib/shared/helpers/postImageSimilarity';
import type { PostImageSimilarityResult } from '$lib/shared/types/postImageSimilarity';

describe('sortSimilarityResultsByCreatedAtDesc', () => {
	it('sorts results by createdAt descending without mutating the input', () => {
		const results: PostImageSimilarityResult[] = [
			{
				post_id: 'a',
				image_url: 'https://cdn.example/a.webp',
				similarity_score: 10,
				createdAt: '2024-01-01T00:00:00.000Z',
				authorUsername: 'a',
				authorProfilePictureUrl: null,
			},
			{
				post_id: 'b',
				image_url: 'https://cdn.example/b.webp',
				similarity_score: 20,
				createdAt: '2025-01-01T00:00:00.000Z',
				authorUsername: 'b',
				authorProfilePictureUrl: null,
			},
		];

		const sorted = sortSimilarityResultsByCreatedAtDesc(results);

		expect(sorted.map((result) => result.post_id)).toEqual(['b', 'a']);
		expect(results.map((result) => result.post_id)).toEqual(['a', 'b']);
	});
});
