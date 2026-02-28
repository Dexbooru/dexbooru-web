import { vi } from 'vitest';

export const mockEmailHelpers = {
	sendEmail: vi.fn().mockResolvedValue(undefined),
	buildPasswordRecoveryEmailTemplate: vi.fn(),
	buildEmailVerificationTemplate: vi.fn().mockReturnValue('<html>verify</html>'),
};

vi.mock('$lib/server/helpers/email', () => mockEmailHelpers);
