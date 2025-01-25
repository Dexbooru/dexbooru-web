import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		cookies.delete(SESSION_ID_KEY, { path: '/' });
	}

	throw redirect(302, '/');
};
