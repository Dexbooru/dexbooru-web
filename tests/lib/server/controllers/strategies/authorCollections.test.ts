import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

const {
	mockValidateAndHandleRequest,
	mockCreateSuccessResponse,
	mockCreateErrorResponse,
	mockFindUserByName,
	mockFindCollectionsByAuthorId,
	mockWithRemoteCache,
} = vi.hoisted(() => ({
	mockValidateAndHandleRequest: vi.fn(),
	mockCreateSuccessResponse: vi.fn(),
	mockCreateErrorResponse: vi.fn(),
	mockFindUserByName: vi.fn(),
	mockFindCollectionsByAuthorId: vi.fn(),
	mockWithRemoteCache: vi.fn(),
}));

vi.mock('$lib/server/helpers/controllers', () => ({
	validateAndHandleRequest: mockValidateAndHandleRequest,
	createSuccessResponse: mockCreateSuccessResponse,
	createErrorResponse: mockCreateErrorResponse,
}));

vi.mock('$lib/server/db/actions/user', () => ({
	findUserByName: mockFindUserByName,
}));

vi.mock('$lib/server/db/actions/collection', () => ({
	findCollectionsByAuthorId: mockFindCollectionsByAuthorId,
}));

vi.mock('$lib/server/controllers/strategies/withRemoteCache', () => ({
	withRemoteCache: mockWithRemoteCache,
}));

import {
	handleGetAuthenticatedUserCollections,
	handleGetUserCollections,
} from '$lib/server/controllers/strategies/authorCollections';

describe('authorCollections strategies', () => {
	const mockEvent = {
		locals: { user: { id: 'user-1', username: 'alice' } },
		url: new URL('http://localhost'),
		request: { headers: new Headers() },
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateSuccessResponse.mockImplementation((_h, _m, data) => data);
		mockCreateErrorResponse.mockImplementation((_h, status, message) => ({ status, message }));
		mockWithRemoteCache.mockImplementation(async ({ compute, shouldCache }) => {
			const result = await compute();
			if (typeof shouldCache === 'function') {
				shouldCache(result);
			}
			return result;
		});
	});

	it('returns 404 when username does not exist on cache miss', async () => {
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, handlerType, _schema, callback) =>
				callback({
					pathParams: { username: 'missing' },
					urlSearchParams: { pageNumber: 0, orderBy: 'createdAt', ascending: false },
				}),
		);
		mockFindUserByName.mockResolvedValue(null);

		await handleGetUserCollections(mockEvent, 'api-route');

		expect(mockCreateErrorResponse).toHaveBeenCalledWith(
			'api-route',
			404,
			'A username called missing does not exist',
		);
		expect(mockFindCollectionsByAuthorId).not.toHaveBeenCalled();
	});

	it('loads collections for an existing username', async () => {
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, handlerType, _schema, callback) =>
				callback({
					pathParams: { username: 'alice' },
					urlSearchParams: { pageNumber: 1, orderBy: 'createdAt', ascending: true },
				}),
		);
		mockFindUserByName.mockResolvedValue({ id: 'user-1' });
		mockFindCollectionsByAuthorId.mockResolvedValue([{ id: 'c1' }]);

		await handleGetUserCollections(mockEvent, 'api-route');

		expect(mockFindCollectionsByAuthorId).toHaveBeenCalledWith(
			'user-1',
			1,
			true,
			'createdAt',
			expect.anything(),
		);
		expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Successfully fetched user collections',
			expect.objectContaining({
				collections: [{ id: 'c1' }],
				pageNumber: 1,
				ascending: true,
				orderBy: 'createdAt',
			}),
		);
	});

	it('loads authenticated user collections with user id cache key', async () => {
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) =>
				callback({
					urlSearchParams: { pageNumber: 0, orderBy: 'createdAt', ascending: false },
				}),
		);
		mockFindCollectionsByAuthorId.mockResolvedValue([{ id: 'c2' }]);

		await handleGetAuthenticatedUserCollections(mockEvent);

		expect(mockFindUserByName).not.toHaveBeenCalled();
		expect(mockFindCollectionsByAuthorId).toHaveBeenCalledWith(
			'user-1',
			0,
			false,
			'createdAt',
			expect.anything(),
		);
		expect(mockWithRemoteCache).toHaveBeenCalledWith(
			expect.objectContaining({
				cacheKey: 'collections-author-user-1-createdAt-false-0',
			}),
		);
		expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
			'page-server-load',
			'Successfully fetched user collections',
			expect.objectContaining({ collections: [{ id: 'c2' }] }),
		);
	});
});
