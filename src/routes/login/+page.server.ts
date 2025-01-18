import { handleUserAuthFlowForm } from '$lib/server/controllers/users';
import {
	DiscordOauthProvider,
	GithubOauthProvider,
	GoogleOauthProvider,
} from '$lib/server/helpers/oauth';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

const handleLogin: Action = async (event) => {
	return await handleUserAuthFlowForm(event);
};

export const actions = {
	default: handleLogin,
} satisfies Actions;

export const load: PageServerLoad = async (event) => {
	if (event.locals.user.id !== NULLABLE_USER.id) {
		redirect(302, '/');
	}

	const googleAuthProvider = new GoogleOauthProvider(event);
	const discordAuthProvider = new DiscordOauthProvider(event);
	const githubAuthProvider = new GithubOauthProvider(event);

	const [googleAuthorizationUrl, discordAuthorizationUrl, githubAuthorizationUrl] =
		await Promise.all([
			googleAuthProvider.getAuthorizationUrl(),
			discordAuthProvider.getAuthorizationUrl(),
			githubAuthProvider.getAuthorizationUrl(),
		]);

	return {
		discordAuthorizationUrl,
		githubAuthorizationUrl,
		googleAuthorizationUrl,
	};
};
