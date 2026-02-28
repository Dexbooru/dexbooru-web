import { vi } from 'vitest';

export const mockEmailHelpers = {
	sendEmail: vi.fn(),
	buildPasswordRecoveryEmailTemplate: vi.fn(),
};

vi.mock('$lib/server/helpers/email', () => mockEmailHelpers);
