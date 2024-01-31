import { SESSION_ID_KEY } from '$lib/server/constants/cookies';
import { createSessionForUser, findUserByName } from '$lib/server/db/actions/user';
import { buildCookieOptions } from '$lib/server/helpers/cookies';
import { passwordsMatch } from '$lib/server/helpers/password';
import { getFormFields } from '$lib/shared/helpers/forms';
import type { ILoginFormFields } from '$lib/shared/types/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions } from './$types';

const handleLogin: Action = async ({ request, cookies }) => {
	const loginForm = await request.formData();

	const { username, password, rememberMe } = getFormFields<ILoginFormFields>(loginForm);

	if (!username || !password) {
		return fail(400, { username, reason: 'At least one of the required fields is missing!' });
	}

	const finalRememberMe = rememberMe ? rememberMe : 'off';

	const user = await findUserByName(username);
	if (!user) {
		return fail(400, { username, reason: 'There was no user with this name that was found!' });
	}

	const passwordMatchConfirmed = await passwordsMatch(password, user.password);
	if (!passwordMatchConfirmed) {
		return fail(400, { username, reason: 'The password is incorrect!' });
	}

	const newSessionId = await createSessionForUser(user.id);
	cookies.set(SESSION_ID_KEY, newSessionId, buildCookieOptions(finalRememberMe));

	throw redirect(302, '/');
};

export const actions = {
	default: handleLogin
} satisfies Actions;
