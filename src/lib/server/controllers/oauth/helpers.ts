import type { UserAuthenticationSource } from '$generated/prisma/client';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { upsertAccountLink } from '../../db/actions/linkedAccount';
import { createErrorResponse } from '../../helpers/controllers';
import type { TOauthApplication, TSimplifiedUserResponse } from '../../types/oauth';

type TOauthProcessingUrlParams = {
	redirectTo?: string;
	token: string;
	applicationName: TOauthApplication;
};

export const buildOauthProcessingUrl = (data: TOauthProcessingUrlParams): string => {
	const { redirectTo = '/', token, applicationName } = data;
	const searchParams = new URLSearchParams();
	searchParams.set(SESSION_ID_KEY, token);
	searchParams.set('application', applicationName);
	searchParams.set('redirectTo', redirectTo);

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
