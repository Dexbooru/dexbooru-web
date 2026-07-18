import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
	mockGetRemoteResponseFromCache,
	mockCacheResponseRemotely,
	mockCacheMultipleToCollectionRemotely,
} = vi.hoisted(() => ({
	mockGetRemoteResponseFromCache: vi.fn(),
	mockCacheResponseRemotely: vi.fn(),
	mockCacheMultipleToCollectionRemotely: vi.fn(),
}));

vi.mock('$lib/server/helpers/sessions', () => ({
	getRemoteResponseFromCache: mockGetRemoteResponseFromCache,
	cacheResponseRemotely: mockCacheResponseRemotely,
	cacheMultipleToCollectionRemotely: mockCacheMultipleToCollectionRemotely,
}));

import { withRemoteCache } from '$lib/server/controllers/strategies/withRemoteCache';

describe('withRemoteCache', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns cached data without computing', async () => {
		mockGetRemoteResponseFromCache.mockResolvedValue({ posts: [] });
		const compute = vi.fn();

		const result = await withRemoteCache({
			cacheKey: 'key-1',
			ttlSeconds: 60,
			compute,
		});

		expect(result).toEqual({ posts: [] });
		expect(compute).not.toHaveBeenCalled();
		expect(mockCacheResponseRemotely).not.toHaveBeenCalled();
	});

	it('treats empty arrays as cache hits', async () => {
		mockGetRemoteResponseFromCache.mockResolvedValue([]);
		const compute = vi.fn();

		const result = await withRemoteCache({
			cacheKey: 'key-empty',
			ttlSeconds: 30,
			compute,
		});

		expect(result).toEqual([]);
		expect(compute).not.toHaveBeenCalled();
	});

	it('treats falsey non-null values as cache hits', async () => {
		mockGetRemoteResponseFromCache.mockResolvedValue(false);
		const compute = vi.fn();

		const result = await withRemoteCache({
			cacheKey: 'key-false',
			ttlSeconds: 30,
			compute,
		});

		expect(result).toBe(false);
		expect(compute).not.toHaveBeenCalled();
	});

	it('computes, caches, and associates keys on miss', async () => {
		mockGetRemoteResponseFromCache.mockResolvedValue(null);
		const computed = { posts: [{ id: 'p1' }, { id: 'p2' }] };

		const result = await withRemoteCache({
			cacheKey: 'key-2',
			ttlSeconds: 120,
			compute: async () => computed,
			getAssociateKeys: (value) => value.posts.map((post) => `postkeys-${post.id}`),
		});

		expect(result).toEqual(computed);
		expect(mockCacheResponseRemotely).toHaveBeenCalledWith('key-2', computed, 120);
		expect(mockCacheMultipleToCollectionRemotely).toHaveBeenCalledWith(
			['postkeys-p1', 'postkeys-p2'],
			'key-2',
		);
	});

	it('skips writing cache when shouldCache is false', async () => {
		mockGetRemoteResponseFromCache.mockResolvedValue(null);
		const computed = { posts: [] };

		await withRemoteCache({
			cacheKey: 'key-3',
			ttlSeconds: 60,
			shouldCache: false,
			compute: async () => computed,
			getAssociateKeys: () => ['postkeys-p1'],
		});

		expect(mockCacheResponseRemotely).not.toHaveBeenCalled();
		expect(mockCacheMultipleToCollectionRemotely).not.toHaveBeenCalled();
	});

	it('skips writing cache when shouldCache predicate returns false', async () => {
		mockGetRemoteResponseFromCache.mockResolvedValue(null);

		await withRemoteCache({
			cacheKey: 'key-4',
			ttlSeconds: 60,
			shouldCache: (value) => !('notFound' in value),
			compute: async () => ({ notFound: true as const }),
		});

		expect(mockCacheResponseRemotely).not.toHaveBeenCalled();
	});

	it('uses resolveTtl for dynamic expiry', async () => {
		mockGetRemoteResponseFromCache.mockResolvedValue(null);
		const computed = { posts: [] as unknown[] };

		await withRemoteCache({
			cacheKey: 'key-5',
			ttlSeconds: 60,
			resolveTtl: (value) => (value.posts.length === 0 ? 300 : 60),
			compute: async () => computed,
		});

		expect(mockCacheResponseRemotely).toHaveBeenCalledWith('key-5', computed, 300);
	});
});
