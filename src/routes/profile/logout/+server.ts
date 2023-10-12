import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SESSION_ID_KEY } from '$lib/server/auth/cookies';
import { deleteSessionFromUser } from '$lib/server/db/actions/user';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		const sessionId = cookies.get(SESSION_ID_KEY);
		cookies.delete(SESSION_ID_KEY);
		await deleteSessionFromUser(sessionId || '');
	}

	throw redirect(302, '/');
};
