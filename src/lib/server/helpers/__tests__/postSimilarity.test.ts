import { describe, expect, it } from 'vitest';
import {
	computeSimilarityScore,
	POST_SIMILARITY_MINIMUM_SCORE_THRESHOLD,
	rankSimilarityCandidates,
	scoreAndRankSimilarityCandidates,
	shouldSkipSimilarityForSafeMode,
} from '../postSimilarity';
import type { TSimilarityFeatures } from '$lib/server/types/postSimilarity';

const target: TSimilarityFeatures = {
	tags: ['blue_hair', 'smile'],
	artists: ['artist_a'],
	sources: [
		{
			sourceTitle: 'Franchise One',
			sourceType: 'ANIME',
			characterName: 'Hero',
		},
	],
};

describe('postSimilarity helpers', () => {
	it('normalizes weighted similarity score in [0, 1]', () => {
		const candidate: TSimilarityFeatures = {
			tags: ['blue_hair'],
			artists: ['artist_a'],
			sources: [
				{
					sourceTitle: 'Franchise One',
					sourceType: 'ANIME',
					characterName: 'Hero',
				},
			],
		};

		const score = computeSimilarityScore(target, candidate);
		expect(score.score).toBeGreaterThanOrEqual(0);
		expect(score.score).toBeLessThanOrEqual(1);
	});

	it('prioritizes artist and source overlap over tag-only overlap', () => {
		const artistAndSourceMatch: TSimilarityFeatures = {
			tags: [],
			artists: ['artist_a'],
			sources: [
				{
					sourceTitle: 'Franchise One',
					sourceType: 'ANIME',
					characterName: 'Hero',
				},
			],
		};
		const tagOnlyMatch: TSimilarityFeatures = {
			tags: ['blue_hair', 'smile'],
			artists: [],
			sources: [],
		};

		const strongScore = computeSimilarityScore(target, artistAndSourceMatch);
		const weakScore = computeSimilarityScore(target, tagOnlyMatch);

		expect(strongScore.score).toBeGreaterThan(weakScore.score);
	});

	it('produces bounded overlap components', () => {
		const candidate: TSimilarityFeatures = {
			tags: ['smile'],
			artists: ['artist_a'],
			sources: [],
		};

		const score = computeSimilarityScore(target, candidate);
		expect(score.artistOverlap).toBeGreaterThanOrEqual(0);
		expect(score.artistOverlap).toBeLessThanOrEqual(1);
		expect(score.sourceOverlap).toBeGreaterThanOrEqual(0);
		expect(score.sourceOverlap).toBeLessThanOrEqual(1);
		expect(score.tagOverlap).toBeGreaterThanOrEqual(0);
		expect(score.tagOverlap).toBeLessThanOrEqual(1);
	});

	it('skips NSFW similarity when browsing safe mode', () => {
		expect(shouldSkipSimilarityForSafeMode(true, true)).toBe(true);
		expect(shouldSkipSimilarityForSafeMode(false, true)).toBe(false);
		expect(shouldSkipSimilarityForSafeMode(true, false)).toBe(false);
	});

	it('orders by score first and recency as tie-breaker', () => {
		const older = new Date('2024-01-01T00:00:00.000Z');
		const newer = new Date('2024-02-01T00:00:00.000Z');
		const ranked = rankSimilarityCandidates([
			{ id: 'same-score-older', score: 0.6, createdAt: older },
			{ id: 'same-score-newer', score: 0.6, createdAt: newer },
			{ id: 'highest-score', score: 0.9, createdAt: older },
		]).map((entry) => entry.id);

		expect(ranked).toEqual(['highest-score', 'same-score-newer', 'same-score-older']);
	});

	it('excludes candidates below minimum threshold', () => {
		const result = scoreAndRankSimilarityCandidates(
			target,
			[
				{
					id: 'weak',
					tagString: 'blue_hair',
					artistString: '',
					createdAt: new Date('2024-02-01T00:00:00.000Z'),
					sources: [],
				},
			],
			6,
		);
		expect(result.sortedIds).toEqual([]);
		expect(result.similarityMap.weak).toBeLessThan(POST_SIMILARITY_MINIMUM_SCORE_THRESHOLD);
	});
});
