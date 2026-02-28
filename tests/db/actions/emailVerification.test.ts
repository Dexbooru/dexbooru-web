import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.unmock('$lib/server/db/actions/emailVerification');

import { mockPrisma } from '../../mocks/prisma';
import {
	createEmailVerificationToken,
	getEmailVerificationToken,
	deleteEmailVerificationToken,
} from '$lib/server/db/actions/emailVerification';

describe('emailVerification actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createEmailVerificationToken', () => {
		it('should call prisma.emailVerificationToken.create with userId and expiresAt', async () => {
			mockPrisma.emailVerificationToken.create.mockResolvedValue({
				id: 'token-id',
				userId: 'u1',
				expiresAt: new Date(),
			});

			await createEmailVerificationToken('u1');

			expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalledWith({
				data: {
					id: expect.any(String),
					userId: 'u1',
					expiresAt: expect.any(Date),
				},
			});
		});
	});

	describe('getEmailVerificationToken', () => {
		it('should call prisma.emailVerificationToken.findUnique', async () => {
			mockPrisma.emailVerificationToken.findUnique.mockResolvedValue({
				id: 'token-id',
				userId: 'u1',
				expiresAt: new Date(),
			});

			await getEmailVerificationToken('token-id');

			expect(mockPrisma.emailVerificationToken.findUnique).toHaveBeenCalledWith({
				where: { id: 'token-id' },
				select: undefined,
			});
		});

		it('should pass selectors when provided', async () => {
			mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null);

			await getEmailVerificationToken('token-id', { userId: true, expiresAt: true });

			expect(mockPrisma.emailVerificationToken.findUnique).toHaveBeenCalledWith({
				where: { id: 'token-id' },
				select: { userId: true, expiresAt: true },
			});
		});
	});

	describe('deleteEmailVerificationToken', () => {
		it('should call prisma.emailVerificationToken.delete', async () => {
			mockPrisma.emailVerificationToken.delete.mockResolvedValue({});

			await deleteEmailVerificationToken('token-id');

			expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith({
				where: { id: 'token-id' },
			});
		});
	});
});
