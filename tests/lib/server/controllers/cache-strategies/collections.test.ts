import { describe, expect, it } from 'vitest';
import {
	getCacheKeyForAuthorCollections,
	getCacheKeyForCollectionsForPost,
	getCacheKeyForGeneralCollectionPagination,
} from '$lib/server/controllers/cache-strategies/collections';

describe('collection cache strategy helpers', () => {
	it('builds author collection keys from author, sort, and page', () => {
		expect(getCacheKeyForAuthorCollections('alice', 'createdAt', false, 2)).toBe(
			'collections-author-alice-createdAt-false-2',
		);
	});

	it('builds post-collection keys including pagination params', () => {
		expect(getCacheKeyForCollectionsForPost('post-1', 'updatedAt', true, 3)).toBe(
			'collection-post-post-1-updatedAt-true-3',
		);
	});

	it('builds general collection pagination keys', () => {
		expect(getCacheKeyForGeneralCollectionPagination('createdAt', true, 0)).toBe(
			'collection-createdAt-true-0',
		);
	});
});
