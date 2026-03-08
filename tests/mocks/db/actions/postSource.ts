import { vi } from 'vitest';

export const mockPostSourceActions = {
	findPostsByCharacterName: vi.fn(),
	findPostsBySourceTitle: vi.fn(),
};

vi.mock('$lib/server/db/actions/postSource', () => mockPostSourceActions);
