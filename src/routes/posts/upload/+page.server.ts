import { handleCreatePost } from '$lib/server/controllers/posts';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

const defaultHandler: Action = async (event) => {
	return await handleCreatePost(event, 'form-action');
};

export const actions = {
	default: defaultHandler,
} satisfies Actions;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user.id === NULLABLE_USER.id) {
		redirect(302, '/');
	}
};
