import { vi } from 'vitest';

/**
 * Manual mocks for collection actions. Do not call `vi.mock` here — that would shadow the real
 * module for `tests/db/actions/collection.test.ts`. Use `vi.hoisted` + `vi.mock` in the spec that
 * needs a stub (see moderation controller tests).
 */
export const mockCollectionActions = {
	findCollectionById: vi.fn(),
	updateCollectionModerationStatus: vi.fn(),
};
