import { SESSION_ID_KEY } from '$lib/server/auth/cookies';
import { PUBLIC_USER_SELECTORS, findUserBySessionId } from '$lib/server/db/actions/user';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get(SESSION_ID_KEY);
	if (sessionId) {
		const sessionUser = await findUserBySessionId(sessionId, PUBLIC_USER_SELECTORS);
		if (sessionUser) {
			event.locals.user = sessionUser;
		}
	}

	return await resolve(event);
};
