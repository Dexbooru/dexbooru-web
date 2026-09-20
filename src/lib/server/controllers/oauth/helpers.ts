import type { UserAuthenticationSource } from '$generated/prisma/client';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { upsertAccountLink } from '../../db/actions/linkedAccount';
import { createErrorResponse } from '../../helpers/controllers';
import type { TOauthApplication, TSimplifiedUserResponse } from '../../types/oauth';

type TOauthProcessingUrlParams = {
	redirectTo?: string;
	applicationName: TOauthApplication;
} & ({ token: string; totpChallengeId?: never } | { totpChallengeId: string; token?: never });

export const buildOauthProcessingUrl = (data: TOauthProcessingUrlParams): string => {
	const { redirectTo = '/', applicationName } = data;
	const searchParams = new URLSearchParams();
	searchParams.set('application', applicationName);
	searchParams.set('redirectTo', redirectTo);

	if ('totpChallengeId' in data && data.totpChallengeId) {
		searchParams.set('totpChallengeId', data.totpChallengeId);
	} else if ('token' in data) {
		searchParams.set(SESSION_ID_KEY, data.token);
	}

	return `/oauth/process?${searchParams.toString()}`;
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
