import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import type { TPostsByLabelStrategy } from '$lib/server/controllers/strategies/types';

const {
	mockValidateAndHandleRequest,
	mockCreateSuccessResponse,
	mockCreateErrorResponse,
	mockWithRemoteCache,
} = vi.hoisted(() => ({
	mockValidateAndHandleRequest: vi.fn(),
	mockCreateSuccessResponse: vi.fn(),
	mockCreateErrorResponse: vi.fn(),
	mockWithRemoteCache: vi.fn(),
}));

vi.mock('$lib/server/helpers/controllers', () => ({
	validateAndHandleRequest: mockValidateAndHandleRequest,
	createSuccessResponse: mockCreateSuccessResponse,
	createErrorResponse: mockCreateErrorResponse,
}));

vi.mock('$lib/server/controllers/strategies/withRemoteCache', () => ({
	withRemoteCache: mockWithRemoteCache,
}));

import { createCachedPaginatedHandler } from '$lib/server/controllers/strategies/createCachedPaginatedHandler';

describe('createCachedPaginatedHandler', () => {
	const mockEvent = {
		locals: { user: { id: 'u1' } },
		url: new URL('http://localhost'),
		request: { headers: new Headers() },
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateSuccessResponse.mockImplementation((_h, _m, data) => data);
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					pathParams: { name: 'sakura' },
					urlSearchParams: { pageNumber: 0, orderBy: 'createdAt', ascending: false },
				});
			},
		);
	});

	it('delegates to withRemoteCache and returns a success response', async () => {
		const findPosts = vi
			.fn()
			.mockResolvedValue([{ id: 'p1', tagString: 'sakura', artistString: 'artist' }]);
		const strategy: TPostsByLabelStrategy = {
			schema: {},
			getLabel: (data) => (data.pathParams as { name: string }).name,
			buildCacheKey: () => 'tag-sakura-0-createdAt-false',
			cacheTtlSeconds: 60,
			findPosts,
			successMessage: (label) => `ok:${label}`,
			errorMessage: 'failed',
		};

		mockWithRemoteCache.mockImplementation(async ({ compute }) => compute());

		const handler = createCachedPaginatedHandler(strategy);
		await handler(mockEvent, 'api-route');

		expect(findPosts).toHaveBeenCalledWith(
			expect.objectContaining({
				label: 'sakura',
				pageNumber: 0,
				orderBy: 'createdAt',
				ascending: false,
			}),
		);
		expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'ok:sakura',
			expect.objectContaining({
				pageNumber: 0,
				posts: [
					expect.objectContaining({
						tags: [{ name: 'sakura' }],
						artists: [{ name: 'artist' }],
					}),
				],
			}),
		);
	});

	it('partitions cache keys by handlerType', async () => {
		const strategy: TPostsByLabelStrategy = {
			schema: {},
			getLabel: () => 'sakura',
			buildCacheKey: () => 'tag-sakura-0-createdAt-false',
			cacheTtlSeconds: 60,
			findPosts: vi.fn().mockResolvedValue([]),
			successMessage: () => 'ok',
			errorMessage: 'failed',
		};

		mockWithRemoteCache.mockImplementation(async ({ cacheKey, compute }) => {
			expect(cacheKey).toBe('tag-sakura-0-createdAt-false-api-route');
			return compute();
		});

		const handler = createCachedPaginatedHandler(strategy);
		await handler(mockEvent, 'api-route');

		expect(mockWithRemoteCache).toHaveBeenCalled();
	});

	it('honors shouldCache=false for author-style strategies', async () => {
		const strategy: TPostsByLabelStrategy = {
			schema: {},
			getLabel: () => 'alice',
			buildCacheKey: () => 'author-alice',
			cacheTtlSeconds: 120,
			findPosts: vi.fn().mockResolvedValue([]),
			shouldCache: (handlerType) => handlerType === 'page-server-load',
			enrichResponse: (pagination, label) => ({ ...pagination, author: label }),
			successMessage: () => 'ok',
			errorMessage: 'failed',
		};

		mockWithRemoteCache.mockImplementation(async ({ shouldCache, compute }) => {
			expect(shouldCache).toBe(false);
			return compute();
		});

		const handler = createCachedPaginatedHandler(strategy);
		await handler(mockEvent, 'api-route');

		expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'ok',
			expect.objectContaining({ author: 'alice' }),
		);
	});
});
