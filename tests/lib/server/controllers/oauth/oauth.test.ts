import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGetOauthAuthorizationUrls } from '$lib/server/controllers/oauth/getOauthAuthorizationUrls';
import { handleOauthChallenge } from '$lib/server/controllers/oauth/oauthChallenge';
import { buildOauthErrorRedirect, buildOauthProcessingUrl } from '$lib/server/controllers/oauth/helpers';
import {
	mockControllerHelpers,
	mockLinkedAccountActions,
	mockOauthProvider,
	mockSkeletonOauthProvider,
	mockPreferenceActions,
	mockTotpHelpers,
	mockSessionHelpers,
	mockUserActions,
	mockPasswordHelpers,
	mockEmailHelpers,
} from '../../../../mocks';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TUser = Prisma.UserGetPayload<Record<string, never>>;
type TPreferences = Prisma.UserPreferenceGetPayload<Record<string, never>>;

describe('oauth controllers', () => {
	const mockEvent = {
		locals: { user: { id: 'anonymous' } },
		getClientAddress: vi.fn().mockReturnValue('127.0.0.1'),
		url: new URL('http://localhost'),
	} as unknown as RequestEvent;

	const oauthUserData = {
		id: 'discord-user-1',
		username: 'linked-user',
		email: 'linked@example.com',
		profilePictureUrl: 'https://cdn.example/avatar.png',
		applicationName: 'discord' as const,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('buildOauthProcessingUrl', () => {
		it('should include the session token for a completed login', () => {
			const url = new URL(
				buildOauthProcessingUrl({
					token: 'encoded-token',
					applicationName: 'discord',
					redirectTo: '/posts',
				}),
				'http://localhost',
			);

			expect(url.pathname).toBe('/oauth/process');
			expect(url.searchParams.get('application')).toBe('discord');
			expect(url.searchParams.get('redirectTo')).toBe('/posts');
			expect(url.searchParams.get('dexbooru-session')).toBe('encoded-token');
			expect(url.searchParams.get('totpChallengeId')).toBeNull();
		});

		it('should include the TOTP challenge id when 2FA is required', () => {
			const url = new URL(
				buildOauthProcessingUrl({
					totpChallengeId: 'challenge-id',
					applicationName: 'github',
					redirectTo: '/posts',
				}),
				'http://localhost',
			);

			expect(url.pathname).toBe('/oauth/process');
			expect(url.searchParams.get('application')).toBe('github');
			expect(url.searchParams.get('redirectTo')).toBe('/posts');
			expect(url.searchParams.get('totpChallengeId')).toBe('challenge-id');
			expect(url.searchParams.get('dexbooru-session')).toBeNull();
		});

		it('should prefix the native return url when one is stored', () => {
			const url = new URL(
				buildOauthProcessingUrl({
					token: 'encoded-token',
					applicationName: 'discord',
					redirectTo: '/posts',
					nativeReturnUrl: 'dexboorumobile://oauth/process',
				}),
			);

			expect(url.protocol).toBe('dexboorumobile:');
			expect(url.host).toBe('oauth');
			expect(url.pathname).toBe('/process');
			expect(url.searchParams.get('application')).toBe('discord');
			expect(url.searchParams.get('dexbooru-session')).toBe('encoded-token');
		});
	});

	describe('buildOauthErrorRedirect', () => {
		it('should send website errors to the login page', () => {
			expect(buildOauthErrorRedirect('nope')).toBe('/login?oauthError=nope');
		});

		it('should send native errors back to the app return url', () => {
			expect(buildOauthErrorRedirect('nope', 'dexboorumobile://oauth/process')).toBe(
				'dexboorumobile://oauth/process?oauthError=nope',
			);
		});
	});

	describe('handleGetOauthAuthorizationUrls', () => {
		it('should return provider authorization urls', async () => {
			mockOauthProvider.getAuthorizationUrl
				.mockResolvedValueOnce('https://accounts.google.com/auth')
				.mockResolvedValueOnce('https://discord.com/oauth2/authorize')
				.mockResolvedValueOnce('https://github.com/login/oauth/authorize');
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ urlSearchParams: { redirectTo: '/posts' } });
				},
			);

			await handleGetOauthAuthorizationUrls(mockEvent);

			expect(mockOauthProvider.getAuthorizationUrl).toHaveBeenCalledTimes(3);
			expect(mockOauthProvider.getAuthorizationUrl).toHaveBeenNthCalledWith(1, '/posts', undefined);
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
				'api-route',
				'Successfully fetched OAuth authorization URLs',
				{
					discordAuthorizationUrl: 'https://discord.com/oauth2/authorize',
					githubAuthorizationUrl: 'https://github.com/login/oauth/authorize',
					googleAuthorizationUrl: 'https://accounts.google.com/auth',
				},
			);
		});

		it('should fall back to /posts when redirectTo is unsafe', async () => {
			mockOauthProvider.getAuthorizationUrl.mockResolvedValue('https://oauth.example/auth');
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ urlSearchParams: { redirectTo: 'https://evil.example' } });
				},
			);

			await handleGetOauthAuthorizationUrls(mockEvent);

			expect(mockOauthProvider.getAuthorizationUrl).toHaveBeenCalledWith('/posts', undefined);
		});

		it('should pass a safe native return url through to providers', async () => {
			mockOauthProvider.getAuthorizationUrl.mockResolvedValue('https://oauth.example/auth');
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						urlSearchParams: {
							redirectTo: '/posts',
							nativeReturnUrl: 'dexboorumobile://oauth/process',
						},
					});
				},
			);

			await handleGetOauthAuthorizationUrls(mockEvent);

			expect(mockOauthProvider.getAuthorizationUrl).toHaveBeenCalledWith(
				'/posts',
				'dexboorumobile://oauth/process',
			);
		});

		it('should drop an unsafe native return url', async () => {
			mockOauthProvider.getAuthorizationUrl.mockResolvedValue('https://oauth.example/auth');
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						urlSearchParams: {
							redirectTo: '/posts',
							nativeReturnUrl: 'https://evil.example/steal',
						},
					});
				},
			);

			await handleGetOauthAuthorizationUrls(mockEvent);

			expect(mockOauthProvider.getAuthorizationUrl).toHaveBeenCalledWith('/posts', undefined);
		});

		it('should return a 500 when a provider fails to build a url', async () => {
			mockOauthProvider.getAuthorizationUrl.mockRejectedValue(new Error('provider down'));
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ urlSearchParams: {} });
				},
			);

			await handleGetOauthAuthorizationUrls(mockEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'api-route',
				500,
				'An unexpected error occurred while fetching OAuth authorization URLs',
			);
		});
	});

	describe('handleOauthChallenge', () => {
		beforeEach(() => {
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						urlSearchParams: { state: 'OAUTH_STATE_DISCORD_abc', code: 'oauth-code' },
					});
				},
			);
			mockSkeletonOauthProvider.getApplicationFromState.mockReturnValue('discord');
			mockSkeletonOauthProvider.extractUserIdFromState.mockReturnValue(undefined);
			mockOauthProvider.validateAuthState.mockResolvedValue({ redirectTo: '/posts' });
			mockOauthProvider.getToken.mockResolvedValue('access-token');
			mockOauthProvider.getUserData.mockResolvedValue(oauthUserData);
			mockSessionHelpers.generateEncodedUserTokenFromRecord.mockReturnValue('encoded-token');
			mockLinkedAccountActions.upsertAccountLink.mockResolvedValue({ id: 'link-1' });
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});
		});

		it('should return 400 when the state does not match a provider', async () => {
			mockSkeletonOauthProvider.getApplicationFromState.mockReturnValue(undefined);

			await handleOauthChallenge(mockEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'page-server-load',
				400,
				'The provided state does not match any oauth application that is supported',
			);
		});

		it('should redirect an existing user to the processing url', async () => {
			mockLinkedAccountActions.findUserFromPlatformNameAndId.mockResolvedValue({
				id: 'u1',
				username: 'linked-user',
			} as TUser);
			mockPreferenceActions.findUserPreferences.mockResolvedValue({
				twoFactorAuthenticationEnabled: false,
			} as TPreferences);

			await expect(handleOauthChallenge(mockEvent)).rejects.toEqual({ status: 302 });

			expect(redirect).toHaveBeenCalledWith(
				302,
				expect.stringMatching(/\/oauth\/process\?.*dexbooru-session=encoded-token/),
			);
			expect(redirect).toHaveBeenCalledWith(302, expect.stringContaining('application=discord'));
		});

		it('should redirect an existing 2FA user through the TOTP challenge', async () => {
			mockLinkedAccountActions.findUserFromPlatformNameAndId.mockResolvedValue({
				id: 'u1',
				username: 'linked-user',
			} as TUser);
			mockPreferenceActions.findUserPreferences.mockResolvedValue({
				twoFactorAuthenticationEnabled: true,
			} as TPreferences);
			mockTotpHelpers.createTotpChallenge.mockResolvedValue('challenge-id');

			await expect(handleOauthChallenge(mockEvent)).rejects.toEqual({ status: 302 });

			expect(mockTotpHelpers.createTotpChallenge).toHaveBeenCalledWith(
				'linked-user',
				'127.0.0.1',
				true,
			);
			expect(redirect).toHaveBeenCalledWith(
				302,
				expect.stringMatching(/\/oauth\/process\?.*totpChallengeId=challenge-id/),
			);
			expect(redirect).toHaveBeenCalledWith(302, expect.stringContaining('application=discord'));
		});

		it('should create a user when no linked account exists', async () => {
			mockLinkedAccountActions.findUserFromPlatformNameAndId.mockResolvedValue(null);
			mockSkeletonOauthProvider.constructPrimaryApplicationUsername.mockReturnValue('linked_user');
			mockPasswordHelpers.generateRandomPassword.mockReturnValue('temp-password');
			mockPasswordHelpers.hashPassword.mockResolvedValue('hashed-temp-password');
			mockUserActions.createUser.mockResolvedValue({
				id: 'u2',
				username: 'linked_user',
				email: 'linked@example.com',
			});

			await expect(handleOauthChallenge(mockEvent)).rejects.toEqual({ status: 302 });

			expect(mockUserActions.createUser).toHaveBeenCalled();
			expect(mockPreferenceActions.createUserPreferences).toHaveBeenCalledWith('u2');
			expect(mockEmailHelpers.sendEmail).toHaveBeenCalled();
			expect(redirect).toHaveBeenCalledWith(
				302,
				expect.stringMatching(/\/oauth\/process\?.*dexbooru-session=encoded-token/),
			);
		});

		it('should redirect an existing user back to the native app', async () => {
			mockOauthProvider.validateAuthState.mockResolvedValue({
				redirectTo: '/posts',
				nativeReturnUrl: 'dexboorumobile://oauth/process',
			});
			mockLinkedAccountActions.findUserFromPlatformNameAndId.mockResolvedValue({
				id: 'u1',
				username: 'linked-user',
			} as TUser);
			mockPreferenceActions.findUserPreferences.mockResolvedValue({
				twoFactorAuthenticationEnabled: false,
			} as TPreferences);

			await expect(handleOauthChallenge(mockEvent)).rejects.toEqual({ status: 302 });

			expect(redirect).toHaveBeenCalledWith(
				302,
				expect.stringMatching(
					/^dexboorumobile:\/\/oauth\/process\?.*dexbooru-session=encoded-token/,
				),
			);
		});

		it('should redirect native 2FA users with a totp challenge id', async () => {
			mockOauthProvider.validateAuthState.mockResolvedValue({
				redirectTo: '/posts',
				nativeReturnUrl: 'exp://192.168.1.20:8081/--/oauth/process',
			});
			mockLinkedAccountActions.findUserFromPlatformNameAndId.mockResolvedValue({
				id: 'u1',
				username: 'linked-user',
			} as TUser);
			mockPreferenceActions.findUserPreferences.mockResolvedValue({
				twoFactorAuthenticationEnabled: true,
			} as TPreferences);
			mockTotpHelpers.createTotpChallenge.mockResolvedValue('challenge-id');

			await expect(handleOauthChallenge(mockEvent)).rejects.toEqual({ status: 302 });

			expect(redirect).toHaveBeenCalledWith(
				302,
				expect.stringMatching(
					/^exp:\/\/192\.168\.1\.20:8081\/--\/oauth\/process\?.*totpChallengeId=challenge-id/,
				),
			);
		});

		it('should send native oauth errors back to the app', async () => {
			mockOauthProvider.validateAuthState.mockResolvedValue({
				redirectTo: '/posts',
				nativeReturnUrl: 'dexboorumobile://oauth/process',
			});
			mockOauthProvider.getToken.mockRejectedValue(new Error('token exchange failed'));

			await expect(handleOauthChallenge(mockEvent)).rejects.toEqual({ status: 302 });

			expect(redirect).toHaveBeenCalledWith(
				302,
				'dexboorumobile://oauth/process?oauthError=token%20exchange%20failed',
			);
		});
	});
});
