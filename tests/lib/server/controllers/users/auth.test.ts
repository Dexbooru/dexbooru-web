import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleUserAuthFlowForm } from '$lib/server/controllers/users/authentication';
import { handleGetUserTotp, handleProcessUserTotp } from '$lib/server/controllers/users/totp';
import {
	mockUserActions,
	mockControllerHelpers,
	mockPasswordHelpers,
	mockTotpHelpers,
	mockPreferenceActions,
} from '../../../../mocks';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TUser = Prisma.UserGetPayload<Record<string, never>>;
type TPreferences = Prisma.UserPreferenceGetPayload<Record<string, never>>;

describe('auth and totp controllers', () => {
	const mockUser = { id: 'u1', username: 'testuser', email: 'test@example.com' };
	const mockEvent = {
		locals: { user: mockUser },
		cookies: {
			set: vi.fn(),
			delete: vi.fn(),
		},
		getClientAddress: vi.fn().mockReturnValue('127.0.0.1'),
		url: new URL('http://localhost'),
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleUserAuthFlowForm', () => {
		it('should successfully authenticate user without TOTP', async () => {
			mockUserActions.findUserByName.mockResolvedValue({
				id: 'u1',
				password: 'hashed_password',
			} as TUser);
			mockPasswordHelpers.doPasswordsMatch.mockResolvedValue(true);
			mockPreferenceActions.findUserPreferences.mockResolvedValue({
				twoFactorAuthenticationEnabled: false,
			} as TPreferences);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						form: { username: 'testuser', password: 'password', rememberMe: true },
					});
				},
			);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleUserAuthFlowForm(mockEvent)).rejects.toEqual({ status: 302 });

			expect(mockEvent.cookies.set).toHaveBeenCalled();
			expect(redirect).toHaveBeenCalledWith(302, '/posts');
		});

		it('should redirect to TOTP if 2FA enabled', async () => {
			mockUserActions.findUserByName.mockResolvedValue({
				id: 'u1',
				username: 'testuser',
				password: 'hashed_password',
			} as TUser);
			mockPasswordHelpers.doPasswordsMatch.mockResolvedValue(true);
			mockPreferenceActions.findUserPreferences.mockResolvedValue({
				twoFactorAuthenticationEnabled: true,
			} as TPreferences);
			mockTotpHelpers.createTotpChallenge.mockResolvedValue('challenge-id');
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						form: { username: 'testuser', password: 'password', rememberMe: true },
					});
				},
			);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleUserAuthFlowForm(mockEvent)).rejects.toEqual({ status: 302 });

			expect(redirect).toHaveBeenCalledWith(
				302,
				expect.stringContaining('/login/totp/challenge-id'),
			);
		});
	});

	describe('handleProcessUserTotp', () => {
		const totpForm = {
			pathParams: { challengeId: 'c1' },
			form: { username: 'testuser', rememberMe: true, otpCode: '123456' },
		};

		beforeEach(() => {
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback(totpForm);
				},
			);
		});

		it('should successfully authenticate with valid TOTP', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue({ ipAddress: '127.0.0.1' });
			mockUserActions.findUserByName.mockResolvedValue({
				id: 'u1',
				username: 'testuser',
			} as TUser);
			mockTotpHelpers.isValidOtpCode.mockReturnValue(true);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleProcessUserTotp(mockEvent)).rejects.toEqual({ status: 302 });

			expect(mockEvent.cookies.set).toHaveBeenCalled();
			expect(mockTotpHelpers.deleteTotpChallenge).toHaveBeenCalledWith('c1');
			expect(redirect).toHaveBeenCalledWith(302, '/posts');
		});

		it('should return a form error when the OTP code is invalid', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue({ ipAddress: '127.0.0.1' });
			mockUserActions.findUserByName.mockResolvedValue({
				id: 'u1',
				username: 'testuser',
			} as TUser);
			mockTotpHelpers.isValidOtpCode.mockReturnValue(false);

			await handleProcessUserTotp(mockEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'form-action',
				401,
				'The provided TOTP code was incorrect',
				{ reason: 'The provided code was incorrect, please try again!' },
			);
			expect(redirect).not.toHaveBeenCalled();
		});

		it('should redirect to login when the challenge is missing', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue(null);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleProcessUserTotp(mockEvent)).rejects.toEqual({ status: 302 });
			expect(redirect).toHaveBeenCalledWith(302, '/login');
		});

		it('should redirect to login when the client IP does not match the challenge', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue({ ipAddress: '10.0.0.1' });
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleProcessUserTotp(mockEvent)).rejects.toEqual({ status: 302 });
			expect(redirect).toHaveBeenCalledWith(302, '/login');
		});

		it('should redirect to login when the user does not exist', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue({ ipAddress: '127.0.0.1' });
			mockUserActions.findUserByName.mockResolvedValue(null);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleProcessUserTotp(mockEvent)).rejects.toEqual({ status: 302 });
			expect(redirect).toHaveBeenCalledWith(302, '/login');
		});
	});

	describe('handleGetUserTotp', () => {
		const challengeData = {
			username: 'testuser',
			ipAddress: '127.0.0.1',
			rememberMe: true,
		};

		beforeEach(() => {
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { challengeId: 'c1' } });
				},
			);
		});

		it('should return username and rememberMe for the API route', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue(challengeData);

			await handleGetUserTotp(mockEvent, 'api-route');

			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
				'api-route',
				'Successfully fetched the login TOTP challenge',
				{ username: 'testuser', rememberMe: true },
			);
		});

		it('should return the challenge payload for the page load', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue(challengeData);

			await handleGetUserTotp(mockEvent);

			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
				'page-server-load',
				'Successfully fetched the login TOTP challenge id',
				{ challengeData },
			);
		});

		it('should return 404 when the API route cannot find the challenge', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue(null);

			await handleGetUserTotp(mockEvent, 'api-route');

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'api-route',
				404,
				'The TOTP challenge was not found or has expired',
			);
		});

		it('should redirect to login when the page load cannot find the challenge', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue(null);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleGetUserTotp(mockEvent)).rejects.toEqual({ status: 302 });
			expect(redirect).toHaveBeenCalledWith(302, '/login');
		});

		it('should return 403 when the API route client IP does not match', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue({
				...challengeData,
				ipAddress: '10.0.0.1',
			});

			await handleGetUserTotp(mockEvent, 'api-route');

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'api-route',
				403,
				'The TOTP challenge is not valid for this client',
			);
		});

		it('should redirect to login when the page load client IP does not match', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue({
				...challengeData,
				ipAddress: '10.0.0.1',
			});
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleGetUserTotp(mockEvent)).rejects.toEqual({ status: 302 });
			expect(redirect).toHaveBeenCalledWith(302, '/login');
		});
	});
});
