import { deleteSessionFromUser } from '$lib/server/db/actions/user';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SESSION_ID_KEY } from '$lib/server/constants/cookies';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		const sessionId = cookies.get(SESSION_ID_KEY);
		cookies.delete(SESSION_ID_KEY, { path: '/' });
		await deleteSessionFromUser(sessionId || '');
	}

	throw redirect(302, '/');
};
