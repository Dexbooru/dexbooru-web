import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	handleVerifyEmail,
	handleResendVerificationEmail,
} from '$lib/server/controllers/users/emailVerification';
import {
	mockUserActions,
	mockControllerHelpers,
	mockEmailVerificationActions,
	mockEmailHelpers,
	mockSessionHelpers,
	mockCookieHelpers,
} from '../../../../mocks';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { NULLABLE_USER } from '$lib/shared/constants/auth';

describe('email verification controllers', () => {
	const mockEvent = {
		locals: { user: { id: 'u1', username: 'testuser' } },
		getClientAddress: vi.fn().mockReturnValue('127.0.0.1'),
		url: new URL('http://localhost'),
		params: {},
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleVerifyEmail', () => {
		it('should redirect to posts with emailVerified when token is valid', async () => {
			const mockCookies = { set: vi.fn(), delete: vi.fn() };
			const eventWithCookies = {
				...mockEvent,
				cookies: mockCookies,
			} as unknown as RequestEvent;

			mockSessionHelpers.generateEncodedUserTokenFromRecord.mockReturnValue('mock-session-token');
			mockCookieHelpers.buildCookieOptions.mockReturnValue({ path: '/', maxAge: 123 });
			mockEmailVerificationActions.getEmailVerificationToken.mockResolvedValue({
				id: 'token-id',
				userId: 'u1',
				expiresAt: new Date(Date.now() + 10000),
			});
			mockUserActions.findUserById.mockResolvedValue({ id: 'u1' });
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { tokenId: 'token-id' } });
				},
			);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302, url: '/posts?emailVerified=true' };
			});

			await expect(handleVerifyEmail(eventWithCookies)).rejects.toEqual({
				status: 302,
				url: '/posts?emailVerified=true',
			});

			expect(mockUserActions.updateEmailVerifiedByUserId).toHaveBeenCalledWith('u1', true);
			expect(mockEmailVerificationActions.deleteEmailVerificationToken).toHaveBeenCalledWith(
				'token-id',
			);
			expect(mockUserActions.findUserById).toHaveBeenCalledWith('u1', { id: true });
			expect(mockCookies.set).toHaveBeenCalledWith(
				'dexbooru-session',
				expect.any(String),
				expect.any(Object),
			);
			expect(redirect).toHaveBeenCalledWith(302, '/posts?emailVerified=true');
		});

		it('should redirect to posts with verificationExpired when token is expired', async () => {
			mockEmailVerificationActions.getEmailVerificationToken.mockResolvedValue({
				id: 'token-id',
				userId: 'u1',
				expiresAt: new Date(Date.now() - 1000),
			});
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { tokenId: 'token-id' } });
				},
			);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302, url: '/posts?verificationExpired=true' };
			});

			await expect(handleVerifyEmail(mockEvent)).rejects.toMatchObject({
				status: 302,
			});

			expect(mockEmailVerificationActions.deleteEmailVerificationToken).toHaveBeenCalledWith(
				'token-id',
			);
			expect(mockUserActions.updateEmailVerifiedByUserId).not.toHaveBeenCalled();
		});

		it('should redirect to posts with verificationExpired when token not found', async () => {
			mockEmailVerificationActions.getEmailVerificationToken.mockResolvedValue(null);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { tokenId: 'invalid-token' } });
				},
			);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleVerifyEmail(mockEvent)).rejects.toMatchObject({ status: 302 });

			expect(mockUserActions.updateEmailVerifiedByUserId).not.toHaveBeenCalled();
			expect(mockEmailVerificationActions.deleteEmailVerificationToken).not.toHaveBeenCalled();
		});
	});

	describe('handleResendVerificationEmail', () => {
		it('should return 401 when user is not logged in', async () => {
			const unauthenticatedEvent = {
				...mockEvent,
				locals: { user: NULLABLE_USER },
			} as RequestEvent;
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({});
				},
			);

			await handleResendVerificationEmail(unauthenticatedEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'form-action',
				401,
				'You must be logged in to resend the verification email',
			);
			expect(mockEmailHelpers.sendEmail).not.toHaveBeenCalled();
		});

		it('should return 404 when user not found', async () => {
			mockUserActions.findUserById.mockResolvedValue(null);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({});
				},
			);

			await handleResendVerificationEmail(mockEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'form-action',
				404,
				'User not found',
			);
			expect(mockEmailHelpers.sendEmail).not.toHaveBeenCalled();
		});

		it('should return success when user is already verified', async () => {
			mockUserActions.findUserById.mockResolvedValue({
				id: 'u1',
				emailVerified: true,
				email: 'test@test.com',
				username: 'testuser',
			});
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({});
				},
			);

			await handleResendVerificationEmail(mockEvent);

			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
				'form-action',
				'Your email is already verified',
			);
			expect(mockEmailHelpers.sendEmail).not.toHaveBeenCalled();
		});

		it('should successfully send verification email', async () => {
			mockUserActions.findUserById.mockResolvedValue({
				id: 'u1',
				emailVerified: false,
				email: 'test@test.com',
				username: 'testuser',
			});
			mockEmailVerificationActions.createEmailVerificationToken.mockResolvedValue({
				id: 'new-token-id',
			});
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({});
				},
			);

			await handleResendVerificationEmail(mockEvent);

			expect(mockEmailVerificationActions.createEmailVerificationToken).toHaveBeenCalledWith('u1');
			expect(mockEmailHelpers.sendEmail).toHaveBeenCalled();
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
				'form-action',
				'Verification email sent successfully',
			);
		});

		it('should return 500 when email send fails', async () => {
			mockUserActions.findUserById.mockResolvedValue({
				id: 'u1',
				emailVerified: false,
				email: 'test@test.com',
				username: 'testuser',
			});
			mockEmailVerificationActions.createEmailVerificationToken.mockResolvedValue({
				id: 'new-token-id',
			});
			mockEmailHelpers.sendEmail.mockRejectedValue(new Error('SMTP error'));
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({});
				},
			);

			await handleResendVerificationEmail(mockEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'form-action',
				500,
				'An unexpected error occurred while sending the verification email',
			);
		});
	});
});
