import { handleUserOauth2AuthFlowForm } from '$lib/server/controllers/users';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

const handleLogin: Action = async (event) => {
	return handleUserOauth2AuthFlowForm(event);
};

export const actions = {
	default: handleLogin,
} satisfies Actions;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user.id !== NULLABLE_USER.id) {
		throw redirect(302, '/');
	}
};
