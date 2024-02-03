import { SESSION_ID_KEY } from '$lib/server/constants/cookies';
import { getUserClaimsFromEncodedJWTToken, isProtectedRoute } from '$lib/server/helpers/sessions';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.includes('api') && !isProtectedRoute(event.url, event.request.method)) {
		return await resolve(event);
	}

	const userJwtTokenEncoded = event.cookies.get(SESSION_ID_KEY);
	if (userJwtTokenEncoded) {
		const sessionUser = getUserClaimsFromEncodedJWTToken(userJwtTokenEncoded);
		if (sessionUser) {
			event.locals.user = sessionUser;
		}
	} else {
		event.locals.user = null;
	}

	return await resolve(event);
};
