import { describe, expect, it } from 'vitest';
import { getCacheKeyForPostSimilarity } from '$lib/server/controllers/cache-strategies/posts';

describe('post cache strategy helpers', () => {
	it('builds deterministic similarity keys regardless of blacklist ordering', () => {
		const keyA = getCacheKeyForPostSimilarity('post-id', 'user-id', {
			browseInSafeMode: true,
			blacklistedTags: ['tag-b', 'tag-a'],
			blacklistedArtists: ['artist-b', 'artist-a'],
		});
		const keyB = getCacheKeyForPostSimilarity('post-id', 'user-id', {
			browseInSafeMode: true,
			blacklistedTags: ['tag-a', 'tag-b'],
			blacklistedArtists: ['artist-a', 'artist-b'],
		});

		expect(keyA).toBe(keyB);
	});

	it('changes key when safe mode or blacklist values change', () => {
		const baseKey = getCacheKeyForPostSimilarity('post-id', 'user-id', {
			browseInSafeMode: false,
			blacklistedTags: ['tag-a'],
			blacklistedArtists: ['artist-a'],
		});

		const safeModeKey = getCacheKeyForPostSimilarity('post-id', 'user-id', {
			browseInSafeMode: true,
			blacklistedTags: ['tag-a'],
			blacklistedArtists: ['artist-a'],
		});
		const changedBlacklistKey = getCacheKeyForPostSimilarity('post-id', 'user-id', {
			browseInSafeMode: false,
			blacklistedTags: ['tag-b'],
			blacklistedArtists: ['artist-a'],
		});

		expect(baseKey).not.toBe(safeModeKey);
		expect(baseKey).not.toBe(changedBlacklistKey);
	});
});
