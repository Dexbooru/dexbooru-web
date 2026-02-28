import { vi } from 'vitest';

export const mockCookieHelpers = {
	buildCookieOptions: vi.fn(),
};

vi.mock('$lib/server/helpers/cookies', () => mockCookieHelpers);
