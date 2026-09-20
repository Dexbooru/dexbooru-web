import { vi } from 'vitest';

export const mockLinkedAccountActions = {
	findLinkedAccountsFromUserId: vi.fn(),
	findUserFromPlatformNameAndId: vi.fn(),
	upsertAccountLink: vi.fn(),
};

vi.mock('$lib/server/db/actions/linkedAccount', () => mockLinkedAccountActions);
