import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import { findLinkedAccountsFromUserId } from '../../db/actions/linkedAccount';
import { createSuccessResponse, validateAndHandleRequest } from '../../helpers/controllers';
import {
	DiscordOauthProvider,
	GithubOauthProvider,
	GoogleOauthProvider,
} from '../../helpers/oauth';

export const handleGetUserSettings = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'page-server-load', {}, async (_) => {
		if (event.locals.user.id === NULLABLE_USER.id) {
			redirect(302, '/');
		}

		const linkedAccounts = await findLinkedAccountsFromUserId(event.locals.user.id, true);

		const googleAuthProvider = new GoogleOauthProvider(event);
		const discordAuthProvider = new DiscordOauthProvider(event);
		const githubAuthProvider = new GithubOauthProvider(event);

		const [googleAuthorizationUrl, discordAuthorizationUrl, githubAuthorizationUrl] =
			await Promise.all([
				googleAuthProvider.getAuthorizationUrl(),
				discordAuthProvider.getAuthorizationUrl(),
				githubAuthProvider.getAuthorizationUrl(),
			]);

		return createSuccessResponse('page-server-load', 'Successfully fetched the user settings', {
			discordAuthorizationUrl,
			githubAuthorizationUrl,
			googleAuthorizationUrl,
			linkedAccounts,
		});
	});
};
