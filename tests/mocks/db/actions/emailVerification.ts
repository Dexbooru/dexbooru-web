import { vi } from 'vitest';

export const mockEmailVerificationActions = {
	createEmailVerificationToken: vi.fn(),
	deleteEmailVerificationToken: vi.fn(),
	getEmailVerificationToken: vi.fn(),
};

vi.mock('$lib/server/db/actions/emailVerification', () => mockEmailVerificationActions);
