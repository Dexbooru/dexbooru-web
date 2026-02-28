import { vi } from 'vitest';

export const mockPasswordRecoveryAttemptActions = {
	createPasswordRecoveryAttempt: vi.fn(),
	deletePasswordRecoveryAttempt: vi.fn(),
	getPasswordRecoveryAttempt: vi.fn(),
};

vi.mock('$lib/server/db/actions/passwordRecoveryAttempt', () => mockPasswordRecoveryAttemptActions);
