import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SESSION_ID_KEY } from '$lib/server/constants/cookies';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		cookies.delete(SESSION_ID_KEY, { path: '/' });
	}

	throw redirect(302, '/');
};
