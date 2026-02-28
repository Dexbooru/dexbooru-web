import { vi } from 'vitest';

export const mockTotpHelpers = {
	createTotpChallenge: vi.fn(),
	getTotpChallenge: vi.fn(),
	deleteTotpChallenge: vi.fn(),
	isValidOtpCode: vi.fn(),
	generateTotpDataUri: vi.fn(),
};

vi.mock('$lib/server/helpers/totp', () => mockTotpHelpers);
