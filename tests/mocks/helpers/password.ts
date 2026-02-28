import { vi } from 'vitest';

export const mockPasswordHelpers = {
	hashPassword: vi.fn(),
	doPasswordsMatch: vi.fn(),
};

vi.mock('$lib/server/helpers/password', () => mockPasswordHelpers);
