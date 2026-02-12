import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import { findUserByName, findUserById, findUserByEmail } from '../../db/actions/user';
import { findUserPreferences } from '../../db/actions/preference';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { buildCookieOptions } from '../../helpers/cookies';
import { doPasswordsMatch } from '../../helpers/password';
import { generateEncodedUserTokenFromRecord } from '../../helpers/sessions';
import { createTotpChallenge } from '../../helpers/totp';
import { UserAuthFormSchema, UserAuthEndpointSchema } from '../request-schemas/users';
import { SESSION_JWT_API_ENDPOINT_AGE } from '../../constants/cookies';
import type { TUser } from '$lib/shared/types/users';
import type { TRequestSchema } from '../../types/controllers';
import logger from '../../logging/logger';

export const handleUserAuthFlowValidate = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		{} satisfies TRequestSchema,
		async (_) => {
			const user = event.locals.user;
			let isValidUser = true;
			let error: unknown;

			if (user.id === NULLABLE_USER.id) {
				isValidUser = false;
				error = createErrorResponse('api-route', 401, 'Invalid user');
			}

			const users = await Promise.all([
				findUserByName(user.username),
				findUserById(user.id),
				findUserByEmail(user.email),
			]);
			let dbUser: TUser | null = user;
			for (const resultUser of users) {
				if (resultUser === null || resultUser.id !== user.id) {
					dbUser = null;
				}
			}

			if (!dbUser) {
				isValidUser = false;
				error = createErrorResponse('api-route', 404, 'User does not exist');
			}

			if (!isValidUser) {
				event.cookies.delete(SESSION_ID_KEY, { path: '/' });
				return error;
			}

			return createSuccessResponse('api-route', 'The authentication token of the user is valid');
		},
		true,
	);
};

export const handleUserAuthFlowForm = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'form-action', UserAuthFormSchema, async (data) => {
		const { username, password, rememberMe } = data.form;
		const errorData = {
			username,
			reason: 'A user with that name does not exist or the provided password was incorrect!',
		};

		try {
			const user = await findUserByName(username);
			if (!user) {
				return createErrorResponse('form-action', 401, 'The authentication failed', errorData);
			}

			const passwordMatchConfirmed = await doPasswordsMatch(password, user.password);
			if (!passwordMatchConfirmed) {
				return createErrorResponse('form-action', 401, 'The authentication failed', errorData);
			}

			const preferences = await findUserPreferences(user.id);
			if (preferences && preferences.twoFactorAuthenticationEnabled) {
				const ipAddress = event.getClientAddress();
				const newTotpChallengeId = await createTotpChallenge(user.username, ipAddress, rememberMe);
				redirect(302, `/login/totp/${newTotpChallengeId}`);
			}

			const encodedAuthToken = generateEncodedUserTokenFromRecord(user, rememberMe);
			event.cookies.set(
				SESSION_ID_KEY,
				encodedAuthToken,
				buildCookieOptions(rememberMe) as SerializeOptions & { path: string },
			);
			redirect(302, `/posts`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return createErrorResponse(
				'form-action',
				500,
				'An unexpected error occured while trying to authenticate',
			);
		}
	});
};

export const handleUserAuthFlowEndpoint = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UserAuthEndpointSchema,
		async (data) => {
			const { username, password } = data.body;

			try {
				const user = await findUserByName(username);
				if (!user) {
					return createErrorResponse('api-route', 404, `A user called ${username} does not exist`);
				}

				const passwordsMatch = await doPasswordsMatch(password, user.password);
				if (!passwordsMatch) {
					return createErrorResponse(
						'api-route',
						401,
						'The provided password was incorrect, so the authentication failed',
					);
				}

				const encodedAuthToken = generateEncodedUserTokenFromRecord(
					user,
					false,
					SESSION_JWT_API_ENDPOINT_AGE,
				);

				return createSuccessResponse(
					'api-route',
					'Successfully fetched access and refresh tokens for the provided user',
					{
						accessToken: encodedAuthToken,
					},
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to authenticate',
				);
			}
		},
	);
};
