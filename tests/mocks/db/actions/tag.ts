import { vi } from 'vitest';

export const mockTagActions = {
	findPostsByTagName: vi.fn(),
	incrementTagPostCount: vi.fn(),
	decrementTagPostCount: vi.fn(),
};

vi.mock('$lib/server/db/actions/tag', () => mockTagActions);
