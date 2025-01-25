import { handleSendForgotPasswordEmail } from '$lib/server/controllers/users';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

const sendAccountRecoveryEmail: Action = async (event) => {
	return await handleSendForgotPasswordEmail(event);
};

export const actions: Actions = {
	default: sendAccountRecoveryEmail,
};

export const load: PageServerLoad = async (event) => {
	if (event.locals.user.id !== NULLABLE_USER.id) {
		redirect(302, '/');
	}
};
