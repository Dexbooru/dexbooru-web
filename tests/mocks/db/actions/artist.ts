import { vi } from 'vitest';

export const mockArtistActions = {
	findPostsByArtistName: vi.fn(),
	incrementArtistPostCount: vi.fn(),
	decrementArtistPostCount: vi.fn(),
};

vi.mock('$lib/server/db/actions/artist', () => mockArtistActions);
