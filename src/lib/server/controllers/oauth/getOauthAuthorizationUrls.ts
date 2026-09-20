import type { RequestEvent } from '@sveltejs/kit';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { getSafeNativeReturnUrl, getSafeRedirectTo } from '../../helpers/redirect';
import {
	DiscordOauthProvider,
	GithubOauthProvider,
	GoogleOauthProvider,
} from '../../helpers/oauth';
import logger from '../../logging/logger';
import { OauthAuthorizationUrlsGetSchema } from '../request-schemas/oauth';

export const handleGetOauthAuthorizationUrls = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		OauthAuthorizationUrlsGetSchema,
		async (data) => {
			try {
				const redirectTo = getSafeRedirectTo(data.urlSearchParams.redirectTo, '/posts');
				const nativeReturnUrl = getSafeNativeReturnUrl(data.urlSearchParams.nativeReturnUrl);
				const googleAuthProvider = new GoogleOauthProvider(event);
				const discordAuthProvider = new DiscordOauthProvider(event);
				const githubAuthProvider = new GithubOauthProvider(event);

				const [googleAuthorizationUrl, discordAuthorizationUrl, githubAuthorizationUrl] =
					await Promise.all([
						googleAuthProvider.getAuthorizationUrl(redirectTo, nativeReturnUrl),
						discordAuthProvider.getAuthorizationUrl(redirectTo, nativeReturnUrl),
						githubAuthProvider.getAuthorizationUrl(redirectTo, nativeReturnUrl),
					]);

				return createSuccessResponse('api-route', 'Successfully fetched OAuth authorization URLs', {
					discordAuthorizationUrl,
					githubAuthorizationUrl,
					googleAuthorizationUrl,
				});
			} catch (error) {
				logger.error(error);
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching OAuth authorization URLs',
				);
			}
		},
	);
};
