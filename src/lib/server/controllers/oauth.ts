import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import type { UserAuthenticationSource } from '@prisma/client';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import {
	DEXBOORU_NO_REPLY_EMAIL_ADDRESS,
	OAUTH_TEMPORARY_PASSWORD_EMAIL_SUBJECT,
} from '../constants/email';
import { PUBLIC_USER_SELECTORS } from '../constants/users';
import { createAccountLink } from '../db/actions/linkedAccount';
import { createUserPreferences, getUserPreferences } from '../db/actions/preferences';
import { createUser, findUserByEmail } from '../db/actions/user';
import { createErrorResponse, validateAndHandleRequest } from '../helpers/controllers';
import { buildCookieOptions } from '../helpers/cookies';
import { buildOauthPasswordEmailTemplate, sendEmail } from '../helpers/email';
import {
	DiscordOauthProvider,
	GithubOauthProvider,
	GoogleOauthProvider,
	SkeletonOauthProvider,
} from '../helpers/oauth';
import { generateRandomPassword, hashPassword } from '../helpers/password';
import { generateEncodedUserTokenFromRecord } from '../helpers/sessions';
import { createTotpChallenge } from '../helpers/totp';
import type { TRequestSchema } from '../types/controllers';
import type { IOauthProvider, TOauthApplication, TSimplifiedUserResponse } from '../types/oauth';

const OauthCallbackSchema = {
	urlSearchParams: z.object({
		state: z.string().min(1, { message: 'State is required' }),
		code: z.string().min(1, { message: 'Code is required' }),
	}),
} satisfies TRequestSchema;

const handleAccountLink = async (
	userId: string,
	platformName: UserAuthenticationSource,
	oauthUserData: TSimplifiedUserResponse,
	matchingApplication: TOauthApplication,
) => {
	const newAccountLink = await createAccountLink(
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

export const handleOauthChallenge = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		OauthCallbackSchema,
		async (data) => {
			const { state, code } = data.urlSearchParams;
			const authenticatedUser = event.locals.user;

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

				if (authenticatedUser.id !== NULLABLE_USER.id) {
					await handleAccountLink(
						authenticatedUser.id,
						platformName,
						oauthUserData,
						matchingApplication,
					);

					redirect(302, '/profile/settings');
				} else {
					const matchingDbUser = await findUserByEmail(oauthUserData.email, PUBLIC_USER_SELECTORS);

					if (matchingDbUser) {
						const hasPreviouslyLinkedOauthApplication = matchingDbUser.linkedAccounts.some(
							(linkedAccount) => linkedAccount.platform === platformName,
						);

						if (!hasPreviouslyLinkedOauthApplication) {
							await handleAccountLink(
								matchingDbUser.id,
								platformName,
								oauthUserData,
								matchingApplication,
							);
						}

						const preferences = await getUserPreferences(matchingDbUser.id);
						if (preferences && preferences.twoFactorAuthenticationEnabled) {
							const ipAddress = event.getClientAddress();
							const newTotpChallengeId = await createTotpChallenge(
								matchingDbUser.username,
								ipAddress,
								true,
							);
							redirect(302, `/login/totp/${newTotpChallengeId}`);
						}

						const encodedAuthToken = generateEncodedUserTokenFromRecord(matchingDbUser, true);
						event.cookies.set(SESSION_ID_KEY, encodedAuthToken, buildCookieOptions(true));

						redirect(302, `/posts`);
					} else {
						const temporaryPassword = generateRandomPassword(15);
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
							html: buildOauthPasswordEmailTemplate(newUser.username, temporaryPassword),
						});

						const encodedAuthToken = generateEncodedUserTokenFromRecord(newUser, true);
						event.cookies.set(SESSION_ID_KEY, encodedAuthToken, buildCookieOptions(true));

						redirect(302, `/posts`);
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
