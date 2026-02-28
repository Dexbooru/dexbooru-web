import { vi } from 'vitest';

export const mockPreferenceActions = {
	findUserPreferences: vi.fn(),
	updateUserPreferences: vi.fn(),
	createUserPreferences: vi.fn(),
};

vi.mock('$lib/server/db/actions/preference', () => mockPreferenceActions);
