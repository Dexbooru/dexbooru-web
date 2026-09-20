import type { UserAuthenticationSource } from '$generated/prisma/client';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { upsertAccountLink } from '../../db/actions/linkedAccount';
import { createErrorResponse } from '../../helpers/controllers';
import type { TOauthApplication, TSimplifiedUserResponse } from '../../types/oauth';

type TOauthProcessingUrlParams = {
	redirectTo?: string;
	applicationName: TOauthApplication;
	nativeReturnUrl?: string;
} & ({ token: string; totpChallengeId?: never } | { totpChallengeId: string; token?: never });

export const buildOauthProcessingUrl = (data: TOauthProcessingUrlParams): string => {
	const { redirectTo = '/', applicationName, nativeReturnUrl } = data;
	const searchParams = new URLSearchParams();
	searchParams.set('application', applicationName);
	searchParams.set('redirectTo', redirectTo);

	if ('totpChallengeId' in data && data.totpChallengeId) {
		searchParams.set('totpChallengeId', data.totpChallengeId);
	} else if ('token' in data) {
		searchParams.set(SESSION_ID_KEY, data.token);
	}

	const query = searchParams.toString();
	if (nativeReturnUrl) {
		return `${nativeReturnUrl}?${query}`;
	}

	return `/oauth/process?${query}`;
};

export const buildOauthErrorRedirect = (errorMessage: string, nativeReturnUrl?: string): string => {
	const encoded = encodeURIComponent(errorMessage);
	if (nativeReturnUrl) {
		return `${nativeReturnUrl}?oauthError=${encoded}`;
	}

	return `/login?oauthError=${encoded}`;
};

export const handleAccountLink = async (
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
