import { SESSION_ID_KEY } from '$lib/server/auth/cookies';
import { isProtectedRoute } from '$lib/server/auth/sessions';
import { findUserBySessionId } from '$lib/server/db/actions/user';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (!isProtectedRoute(event.url, event.request.method)) {
		return await resolve(event);
	}

	const sessionId = event.cookies.get(SESSION_ID_KEY);
	if (sessionId) {
		const sessionUser = await findUserBySessionId(sessionId, { id: true });
		if (sessionUser) {
			event.locals.user = sessionUser;
		}
	}

	return await resolve(event);
};
