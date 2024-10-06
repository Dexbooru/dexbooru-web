import {
	handleChangePassword,
	handleChangeProfilePicture,
	handleChangeUsername,
	handleDeleteUser,
} from '$lib/server/controllers/users';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

const handleAccountDeletion: Action = async (event) => {
	return await handleDeleteUser(event);
};

const handleAccountChangeProfilePicture: Action = async (event) => {
	return await handleChangeProfilePicture(event);
};

const handleAccountChangeUsername: Action = async (event) => {
	return await handleChangeUsername(event);
};

const handleAccountChangePassword: Action = async (event) => {
	return await handleChangePassword(event);
};

export const actions: Actions = {
	deleteAccount: handleAccountDeletion,
	username: handleAccountChangeUsername,
	password: handleAccountChangePassword,
	profilePicture: handleAccountChangeProfilePicture,
};

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user.id === NULLABLE_USER.id) {
		throw redirect(302, '/');
	}
};
