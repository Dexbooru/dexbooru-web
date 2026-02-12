import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import { findUserById, findUserByName } from '../../db/actions/user';
import { updateUserPreferences } from '../../db/actions/preference';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { buildCookieOptions } from '../../helpers/cookies';
import { doPasswordsMatch } from '../../helpers/password';
import { cacheResponse, generateEncodedUserTokenFromRecord } from '../../helpers/sessions';
import {
	deleteTotpChallenge,
	generateTotpDataUri,
	getTotpChallenge,
	isValidOtpCode,
} from '../../helpers/totp';
import logger from '../../logging/logger';
import {
	UserProcessTotpSchema,
	UserGetTotpSchema,
	UserOtpGenerateSchema,
	User2faEnableSchema,
} from '../request-schemas/users';

export const handleProcessUserTotp = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		UserProcessTotpSchema,
		async (data) => {
			const { challengeId } = data.pathParams;
			const { username, rememberMe, otpCode } = data.form;

			try {
				const totpChallenge = await getTotpChallenge(challengeId);
				if (!totpChallenge) {
					redirect(302, '/login');
				}

				const ipAddress = event.getClientAddress();
				if (ipAddress !== totpChallenge.ipAddress) {
					redirect(302, '/login');
				}

				const user = await findUserByName(username);
				if (!user) {
					redirect(302, '/login');
				}

				const isTotpCodeValid = isValidOtpCode(user.username, otpCode);
				if (!isTotpCodeValid) {
					return createErrorResponse('form-action', 401, 'The provided TOTP code was incorrect', {
						reason: 'The provided code was incorrect, please try again!',
					});
				}

				const encodedAuthToken = generateEncodedUserTokenFromRecord(user, rememberMe);
				event.cookies.set(
					SESSION_ID_KEY,
					encodedAuthToken,
					buildCookieOptions(rememberMe) as SerializeOptions & { path: string },
				);

				deleteTotpChallenge(challengeId);

				redirect(302, `/posts`);
			} catch (error) {
				if (isRedirect(error)) throw error;

				logger.error(error);
				return createErrorResponse(
					'form-action',
					500,
					'An unexpected error occured while submitting the user OTP',
				);
			}
		},
	);
};

export const handleGetUserTotp = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		UserGetTotpSchema,
		async (data) => {
			const { challengeId } = data.pathParams;
			try {
				const challengeData = await getTotpChallenge(challengeId);
				if (!challengeData) {
					redirect(302, '/login');
				}

				const ipAddress = event.getClientAddress();
				if (ipAddress !== challengeData.ipAddress) {
					redirect(302, '/login');
				}

				return createSuccessResponse(
					'page-server-load',
					'Successfully fetched the login TOTP challenge id',
					{ challengeData },
				);
			} catch (error) {
				if (isRedirect(error)) throw error;
				throw createErrorResponse(
					'page-server-load',
					500,
					'An unexpected error occured while fetching the TOTP form',
				);
			}
		},
	);
};

export const handleGenerateUserTotpData = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UserOtpGenerateSchema,
		async (data) => {
			const { password } = data.body;

			try {
				const user = await findUserById(event.locals.user.id);
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						`A user with the id: ${event.locals.user.id} does not exist`,
					);
				}

				const passwordsMatch = await doPasswordsMatch(password, user.password);
				if (!passwordsMatch) {
					return createErrorResponse(
						'api-route',
						401,
						`The provided password for ${user.id} was incorrect`,
					);
				}

				const totpUri = await generateTotpDataUri(user.username);

				cacheResponse(event.setHeaders, 10);

				return createSuccessResponse(
					'api-route',
					'Successfully generated TOTP data uri for the user',
					{
						totpUri,
					},
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while generating the TOTP data for the user',
				);
			}
		},
		true,
	);
};

export const handleToggleUserTwoFactorAuthentication = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'form-action',
		User2faEnableSchema,
		async (data) => {
			const { otpCode, password } = data.form;

			try {
				let twoFactorEnabled = false;

				if (otpCode) {
					const isValidCode = isValidOtpCode(event.locals.user.email, otpCode);
					if (!isValidCode) {
						return createErrorResponse('form-action', 401, 'Incorrect OTP code', {
							message: 'Incorrect OTP code provided',
						});
					}

					twoFactorEnabled = true;
				} else {
					const user = await findUserById(event.locals.user.id, { password: true });
					if (!user) {
						return createErrorResponse(
							'form-action',
							404,
							`The user called ${event.locals.user.username} does not exist`,
						);
					}

					const passwordsMatch = await doPasswordsMatch(password ?? '', user.password);
					if (!passwordsMatch) {
						return createErrorResponse(
							'form-action',
							401,
							`The provided password for was incorrect`,
						);
					}
				}

				await updateUserPreferences(event.locals.user.id, {
					twoFactorAuthenticationEnabled: twoFactorEnabled,
				});

				logger.info(
					`User ${event.locals.user.username} has ${twoFactorEnabled ? 'enabled' : 'disabled'} two factor authentication`,
				);

				return createSuccessResponse(
					'form-action',
					'Successfully updated thw two factor authentication settings for this user',
				);
			} catch (error) {
				logger.error(error);

				const errorMessage = 'An unexpected error occured while trying to update the OTP settings';
				return createErrorResponse('form-action', 500, errorMessage, { message: errorMessage });
			}
		},
		true,
	);
};
