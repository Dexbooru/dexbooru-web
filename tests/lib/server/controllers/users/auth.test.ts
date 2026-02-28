import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleUserAuthFlowForm } from '$lib/server/controllers/users/authentication';
import { handleProcessUserTotp } from '$lib/server/controllers/users/totp';
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
		it('should successfully authenticate with valid TOTP', async () => {
			mockTotpHelpers.getTotpChallenge.mockResolvedValue({ ipAddress: '127.0.0.1' });
			mockUserActions.findUserByName.mockResolvedValue({
				id: 'u1',
				username: 'testuser',
			} as TUser);
			mockTotpHelpers.isValidOtpCode.mockReturnValue(true);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						pathParams: { challengeId: 'c1' },
						form: { username: 'testuser', rememberMe: true, otpCode: '123456' },
					});
				},
			);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleProcessUserTotp(mockEvent)).rejects.toEqual({ status: 302 });

			expect(mockEvent.cookies.set).toHaveBeenCalled();
			expect(redirect).toHaveBeenCalledWith(302, '/posts');
		});
	});
});
