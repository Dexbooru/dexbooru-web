import { isValidEmail } from '$lib/auth/email';
import { hashPassword, getPasswordRequirements } from '$lib/auth/password';
import type { IRegisterFormFields } from '$lib/auth/types';
import { getUsernameRequirements } from '$lib/auth/user';
import { createUser } from '$lib/db/actions/user';
import { getFormFields } from '$lib/helpers';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, Action } from './$types';

const handleRegistration: Action = async ({ request }) => {
	const registerForm = await request.formData();
	const { email, username, password, confirmedPassword } =
		getFormFields<IRegisterFormFields>(registerForm);

	if (!email || !username || !password || !confirmedPassword) {
		return fail(400, {
			email,
			username,
			reason: 'At least one of the required fields is missing!'
		});
	}

	if (password !== confirmedPassword) {
		return fail(400, {
			email,
			username,
			reason: 'The password does not match the confirmed password!'
		});
	}

	const { unsatisfied: usernameUnsatisfied } = getUsernameRequirements(username);
	if (usernameUnsatisfied.length > 0) {
		return fail(400, { email, username, reason: 'The username did not meet the requirements!' });
	}

	if (!isValidEmail(email)) {
		return fail(400, {
			email,
			username,
			reason: 'The email format is given in an invalid format!'
		});
	}

	const { unsatisfied: passwordUnsatisifed } = getPasswordRequirements(password);
	if (passwordUnsatisifed.length > 0) {
		return fail(400, { email, username, reason: 'The password did not meet the requirements!' });
	}

	const hashedPassword = await hashPassword(password);
	const userCreated = await createUser(username, email, hashedPassword);
	if (!userCreated) {
		return fail(400, {
			email,
			username,
			reason: 'An account with this username or email already exists!'
		});
	}

	throw redirect(302, '/login');
};
export const actions = {
	default: handleRegistration
} satisfies Actions;
