import { SESSION_ID_KEY } from '$lib/server/constants/cookies';
import { PUBLIC_USER_SELECTORS } from '$lib/server/constants/users';
import { findUserBySessionId } from '$lib/server/db/actions/user';
import { isProtectedRoute } from '$lib/server/helpers/sessions';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.includes('api') && !isProtectedRoute(event.url, event.request.method)) {
		return await resolve(event);
	}

	const sessionId = event.cookies.get(SESSION_ID_KEY);
	if (sessionId) {
		const sessionUser = await findUserBySessionId(sessionId, PUBLIC_USER_SELECTORS);
		if (sessionUser) {
			event.locals.user = sessionUser;
		}
	} else {
		event.locals.user = null;
	}

	return await resolve(event);
};
