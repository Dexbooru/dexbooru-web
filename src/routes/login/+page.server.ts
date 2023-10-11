import type { ILoginFormFields } from '$lib/auth/types';
import { createSessionForUser, findUserByName } from '$lib/db/actions/user';
import { getFormFields } from '$lib/helpers/forms';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, Action } from './$types';
import { passwordsMatch } from '$lib/auth/password';
import { SESSION_ID_COOKIE_OPTIONS, SESSION_ID_KEY } from '$lib/auth/cookies';

const handleLogin: Action = async ({ request, cookies }) => {
	const loginForm = await request.formData();
	const { username, password } = getFormFields<ILoginFormFields>(loginForm);

	if (!username || !password) {
		return fail(400, { username, reason: 'At least one of the required fields is missing!' });
	}

	const user = await findUserByName(username);
	if (!user) {
		return fail(400, { username, reason: 'There was no user with this name that was found!' });
	}

	const passwordMatchConfirmed = await passwordsMatch(password, user.password);
	if (!passwordMatchConfirmed) {
		return fail(400, { username, reason: 'The password is incorrect!' });
	}

	const newSessionId = await createSessionForUser(user.id);
	cookies.set(SESSION_ID_KEY, newSessionId, SESSION_ID_COOKIE_OPTIONS);

	throw redirect(302, '/');
};

export const actions = {
	default: handleLogin
} satisfies Actions;
