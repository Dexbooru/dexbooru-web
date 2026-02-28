import { vi } from 'vitest';

export const mockSessionHelpers = {
	getRemoteResponseFromCache: vi.fn(),
	cacheResponseRemotely: vi.fn(),
	invalidateCacheRemotely: vi.fn(),
	invalidateMultipleCachesRemotely: vi.fn(),
	getRemoteAssociatedKeys: vi.fn(),
	cacheMultipleToCollectionRemotely: vi.fn(),
	generateEncodedUserTokenFromRecord: vi.fn(),
	cacheResponse: vi.fn(),
};

vi.mock('$lib/server/helpers/sessions', () => mockSessionHelpers);
