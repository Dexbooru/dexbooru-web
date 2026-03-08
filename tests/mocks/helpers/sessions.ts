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
	getUserClaimsFromEncodedJWTToken: vi.fn().mockReturnValue(null),
};

vi.mock('$lib/server/helpers/sessions', () => mockSessionHelpers);
