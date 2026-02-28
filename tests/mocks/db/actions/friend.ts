import { vi } from 'vitest';

export const mockFriendActions = {
	checkIfUserIsFriended: vi.fn(),
};

vi.mock('$lib/server/db/actions/friend', () => mockFriendActions);
