import { error, fail } from '@sveltejs/kit';
import type { Action, Actions } from './$types';
import { getFormFields } from '$lib/helpers/forms';
import type { IChangeUsernameFormFields, IChangePasswordFormFields } from '$lib/auth/types';
import { getPasswordRequirements, hashPassword, passwordsMatch } from '$lib/auth/password';
import { editPasswordByUserId, editUsernameByUserId, findUserById } from '$lib/db/actions/user';
import { getUsernameRequirements } from '$lib/auth/user';

const handleChangeUsername: Action = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to change a username, without being a signed in user!'
		});
	}

	const changeUsernameForm = await request.formData();
	const { newUsername } = getFormFields<IChangeUsernameFormFields>(changeUsernameForm);

	if (!newUsername) {
		return fail(400, { newUsername, reason: 'At least one of the required fields was missing!' });
	}

	const { unsatisfied } = getUsernameRequirements(newUsername);

	if (unsatisfied.length) {
		return fail(400, { newUsername, reason: 'The username did not meet the requirements!' });
	}

	const updatedUsername = await editUsernameByUserId(locals.user.id, newUsername);

	if (!updatedUsername) {
		return fail(400, {
			newUsername,
			reason: `A user with the id: ${locals.user.id} does not exist!`
		});
	}

	return {
		message: 'The username was changed successfully!'
	};
};

const handleChangePassword: Action = async ({ locals, request }) => {
	if (!locals.user) {
		throw error(401, {
			message: 'You are not authorized to change a password, without being a signed in user!'
		});
	}

	const changePasswordForm = await request.formData();
	const { oldPassword, newPassword, confirmedNewPassword } =
		getFormFields<IChangePasswordFormFields>(changePasswordForm);

	if (!oldPassword || !newPassword || !confirmedNewPassword) {
		return fail(400, {
			newPassword,
			confirmedNewPassword,
			reason: 'At least one of the required fields is missing!'
		});
	}

	if (newPassword !== confirmedNewPassword) {
		return fail(400, {
			newPassword,
			confirmedNewPassword,
			reason: 'The new password does not match the confirmed new password!'
		});
	}

	const signedInUser = await findUserById(locals.user.id, { password: true });

	if (!signedInUser) {
		return fail(400, {
			newPassword,
			confirmedNewPassword,
			reason: `A user with the id: ${locals.user.id} does not exist!`
		});
	}

	const { password: actualHashedPassword } = signedInUser;
	if (!passwordsMatch(oldPassword, actualHashedPassword)) {
		return fail(400, {
			newPassword,
			confirmedNewPassword,
			reason: 'The old password does not match the actual password!'
		});
	}

	const { unsatisfied } = getPasswordRequirements(newPassword);

	if (unsatisfied.length > 0) {
		return fail(400, {
			newPassword,
			confirmedNewPassword,
			reason: 'The password did not meet the requirements!'
		});
	}

	const hashedNewPassword = await hashPassword(newPassword);
	const updatedPassword = await editPasswordByUserId(locals.user.id, hashedNewPassword);

	if (!updatedPassword) {
		return fail(400, {
			newPassword,
			confirmedNewPassword,
			reason: `A user with the id: ${locals.user.id} does not exist!`
		});
	}

	return {
		message: 'The password was changed successfully!'
	};
};

export const actions: Actions = {
	username: handleChangeUsername,
	password: handleChangePassword
};
