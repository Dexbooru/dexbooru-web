import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	handleSendForgotPasswordEmail,
	handlePasswordUpdateAccountRecovery,
} from '$lib/server/controllers/users/accountRecovery';
import {
	mockUserActions,
	mockControllerHelpers,
	mockPasswordRecoveryAttemptActions,
	mockEmailHelpers,
	mockPasswordHelpers,
} from '../../../../mocks';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TUser = Prisma.UserGetPayload<{ select: { id: true; username: true; email: true } }>;
type TRecoveryAttempt = Prisma.PasswordRecoveryAttemptGetPayload<{
	select: { userId: true; expiresAt: true; senderIpAddress: true; id: true };
}>;

describe('account recovery controllers', () => {
	const mockEvent = {
		getClientAddress: vi.fn().mockReturnValue('127.0.0.1'),
		url: new URL('http://localhost'),
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleSendForgotPasswordEmail', () => {
		it('should successfully send recovery email', async () => {
			mockUserActions.findUserByEmail.mockResolvedValue({
				id: 'u1',
				username: 'testuser',
				email: 'test@test.com',
			} as TUser);
			mockPasswordRecoveryAttemptActions.createPasswordRecoveryAttempt.mockResolvedValue({
				id: 'attempt-id',
			});
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ form: { email: 'test@test.com' } });
				},
			);

			await handleSendForgotPasswordEmail(mockEvent);

			expect(mockEmailHelpers.sendEmail).toHaveBeenCalled();
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});

		it('should return 404 if user not found', async () => {
			mockUserActions.findUserByEmail.mockResolvedValue(null);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ form: { email: 'wrong@test.com' } });
				},
			);

			await handleSendForgotPasswordEmail(mockEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'form-action',
				404,
				expect.any(String),
			);
		});
	});

	describe('handlePasswordUpdateAccountRecovery', () => {
		it('should successfully update password', async () => {
			mockPasswordRecoveryAttemptActions.getPasswordRecoveryAttempt.mockResolvedValue({
				userId: 'u1',
				expiresAt: new Date(Date.now() + 10000),
				senderIpAddress: '127.0.0.1',
				id: 'r1',
			} as TRecoveryAttempt);
			mockPasswordHelpers.hashPassword.mockResolvedValue('new-hashed-password');
			mockUserActions.updatePasswordByUserId.mockResolvedValue({ id: 'u1' });
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						form: {
							newPassword: 'pass',
							confirmedNewPassword: 'pass',
							userId: 'u1',
							passwordRecoveryAttemptId: 'r1',
						},
					});
				},
			);

			await handlePasswordUpdateAccountRecovery(mockEvent);

			expect(mockUserActions.updatePasswordByUserId).toHaveBeenCalledWith(
				'u1',
				'new-hashed-password',
			);
			expect(mockPasswordRecoveryAttemptActions.deletePasswordRecoveryAttempt).toHaveBeenCalledWith(
				'r1',
			);
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});
	});
});
