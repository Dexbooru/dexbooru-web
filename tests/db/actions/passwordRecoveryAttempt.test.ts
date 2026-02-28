import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.unmock('$lib/server/db/actions/passwordRecoveryAttempt');

import { mockPrisma } from '../../mocks/prisma';
import {
	createPasswordRecoveryAttempt,
	getPasswordRecoveryAttempt,
	deletePasswordRecoveryAttempt,
} from '$lib/server/db/actions/passwordRecoveryAttempt';

describe('passwordRecoveryAttempt actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createPasswordRecoveryAttempt', () => {
		it('should call prisma.passwordRecoveryAttempt.create', async () => {
			mockPrisma.passwordRecoveryAttempt.create.mockResolvedValue({});
			await createPasswordRecoveryAttempt('u1', '127.0.0.1');
			expect(mockPrisma.passwordRecoveryAttempt.create).toHaveBeenCalledWith({
				data: {
					id: expect.any(String),
					senderIpAddress: '127.0.0.1',
					expiresAt: expect.any(Date),
					userId: 'u1',
				},
			});
		});
	});

	describe('getPasswordRecoveryAttempt', () => {
		it('should call prisma.passwordRecoveryAttempt.findUnique', async () => {
			mockPrisma.passwordRecoveryAttempt.findUnique.mockResolvedValue({});
			await getPasswordRecoveryAttempt('id1');
			expect(mockPrisma.passwordRecoveryAttempt.findUnique).toHaveBeenCalledWith({
				where: { id: 'id1' },
				select: undefined,
			});
		});
	});

	describe('deletePasswordRecoveryAttempt', () => {
		it('should call prisma.passwordRecoveryAttempt.delete', async () => {
			mockPrisma.passwordRecoveryAttempt.delete.mockResolvedValue({});
			await deletePasswordRecoveryAttempt('id1');
			expect(mockPrisma.passwordRecoveryAttempt.delete).toHaveBeenCalledWith({
				where: { id: 'id1' },
			});
		});
	});
});
