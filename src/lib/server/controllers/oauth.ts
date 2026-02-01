import type { UserAuthenticationSource } from '$generated/prisma/client';
import { DEFAULT_PASSWORD_LENGTH } from '$lib/shared/constants/auth';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';
import {
	DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
	OAUTH_TEMPORARY_PASSWORD_EMAIL_SUBJECT,
} from '../constants/email';
import { findUserFromPlatformNameAndId, upsertAccountLink } from '../db/actions/linkedAccount';
import { createUserPreferences, findUserPreferences } from '../db/actions/preference';
import { createUser } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import { buildCookieOptions } from '../helpers/cookies';
import { buildOauthPasswordEmailTemplate, sendEmail } from '../helpers/email';
import {
	DiscordOauthProvider,
	GithubOauthProvider,
	GoogleOauthProvider,
	SkeletonOauthProvider,
} from '../helpers/oauth';
import { generateRandomPassword, hashPassword } from '../helpers/password';
import {
	generateEncodedUserTokenFromRecord,
	getUserClaimsFromEncodedJWTToken,
} from '../helpers/sessions';
import { createTotpChallenge } from '../helpers/totp';
import type { IOauthProvider, TOauthApplication, TSimplifiedUserResponse } from '../types/oauth';
import { OauthCallbackSchema, OauthStoreSchema } from './request-schemas/oauth';

type TOauthProcessingUrlParams = {
	redirectTo?: string;
	token: string;
	applicationName: TOauthApplication;
};

const buildOauthProcessingUrl = (data: TOauthProcessingUrlParams): string => {
	const { redirectTo = '/', token, applicationName } = data;
	const searchParams = new URLSearchParams();
	searchParams.set(SESSION_ID_KEY, token);
	searchParams.set('application', applicationName);
	searchParams.set('redirectTo', redirectTo);

	return `/oauth/process?${searchParams.toString()}`;
};

const handleAccountLink = async (
	userId: string,
	platformName: UserAuthenticationSource,
	oauthUserData: TSimplifiedUserResponse,
	matchingApplication: TOauthApplication,
) => {
	const newAccountLink = await upsertAccountLink(
		userId,
		platformName,
		oauthUserData.id,
		oauthUserData.username,
	);

	if (!newAccountLink) {
		return createErrorResponse(
			'page-server-load',
			500,
			`An error occurred while linking your ${matchingApplication} account`,
		);
	}
};

export const handleOauthStorage = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', OauthStoreSchema, async (data) => {
		const token = data.body.token;
		const validatedUser = getUserClaimsFromEncodedJWTToken(token);
		if (!validatedUser) {
			return createErrorResponse('api-route', 401, 'Invalid token');
		}

		event.cookies.set(
			SESSION_ID_KEY,
			token,
			buildCookieOptions(true) as SerializeOptions & { path: string },
		);

		return createSuccessResponse(
			'api-route',
			`Successfully stored token for user with the id: ${validatedUser.id}`,
		);
	});
};

export const handleOauthChallenge = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		OauthCallbackSchema,
		async (data) => {
			const { state, code } = data.urlSearchParams;

			try {
				const matchingApplication = SkeletonOauthProvider.getApplicationFromState(state);
				if (!matchingApplication) {
					return createErrorResponse(
						'page-server-load',
						400,
						'The provided state does not match any oauth application that is supported',
					);
				}

				let authProvider: IOauthProvider;
				let platformName: UserAuthenticationSource;
				switch (matchingApplication) {
					case 'discord':
						authProvider = new DiscordOauthProvider(event);
						platformName = 'DISCORD';
						break;
					case 'google':
						authProvider = new GoogleOauthProvider(event);
						platformName = 'GOOGLE';
						break;
					case 'github':
						authProvider = new GithubOauthProvider(event);
						platformName = 'GITHUB';
						break;
				}

				const accessToken = await authProvider.getToken(code, state);
				const oauthUserData = await authProvider.getUserData(accessToken);
				const userIdFromState = SkeletonOauthProvider.extractUserIdFromState(state);

				if (userIdFromState) {
					await handleAccountLink(
						userIdFromState,
						platformName,
						oauthUserData,
						matchingApplication,
					);

					const encodedAuthToken = generateEncodedUserTokenFromRecord(
						{ id: userIdFromState },
						true,
					);
					const oauthProcessingUrl = buildOauthProcessingUrl({
						token: encodedAuthToken,
						applicationName: matchingApplication,
						redirectTo: '/profile/settings?tab=security',
					});

					redirect(302, oauthProcessingUrl);
				} else {
					const matchingDbUser = await findUserFromPlatformNameAndId(
						platformName,
						oauthUserData.id,
					);

					if (matchingDbUser) {
						await handleAccountLink(
							matchingDbUser.id,
							platformName,
							oauthUserData,
							matchingApplication,
						);

						const preferences = await findUserPreferences(matchingDbUser.id);
						if (preferences.twoFactorAuthenticationEnabled) {
							const ipAddress = event.getClientAddress();
							const newTotpChallengeId = await createTotpChallenge(
								matchingDbUser.username,
								ipAddress,
								true,
							);
							redirect(302, `/login/totp/${newTotpChallengeId}`);
						}

						const encodedAuthToken = generateEncodedUserTokenFromRecord(matchingDbUser, true);
						const oauthProcessingUrl = buildOauthProcessingUrl({
							token: encodedAuthToken,
							applicationName: matchingApplication,
							redirectTo: '/posts',
						});

						redirect(302, oauthProcessingUrl);
					} else {
						const temporaryPassword = generateRandomPassword(DEFAULT_PASSWORD_LENGTH);
						const hashedTemporaryPassword = await hashPassword(temporaryPassword);

						const newUser = await createUser(
							SkeletonOauthProvider.constructPrimaryApplicationUsername(oauthUserData.username),
							oauthUserData.email,
							hashedTemporaryPassword,
							oauthUserData.profilePictureUrl,
						);

						await createUserPreferences(newUser.id);
						await handleAccountLink(newUser.id, platformName, oauthUserData, matchingApplication);

						sendEmail({
							sender: `Dexbooru <${DEXBOORU_NO_REPLY_EMAIL_ADDRESS}>`,
							to: newUser.email,
							subject: OAUTH_TEMPORARY_PASSWORD_EMAIL_SUBJECT,
							html: buildOauthPasswordEmailTemplate(
								newUser.username,
								temporaryPassword,
								matchingApplication,
							),
						});

						const encodedAuthToken = generateEncodedUserTokenFromRecord(newUser, true);
						const oauthProcessingUrl = buildOauthProcessingUrl({
							token: encodedAuthToken,
							applicationName: matchingApplication,
							redirectTo: '/posts',
						});

						redirect(302, oauthProcessingUrl);
					}
				}
			} catch (error) {
				if (isRedirect(error)) throw error;

				const errorMesssage = (error as Error).message;
				redirect(302, '/login?oauthError=' + encodeURIComponent(errorMesssage));
			}
		},
	);
};
