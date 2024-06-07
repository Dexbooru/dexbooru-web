import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { getUserClaimsFromEncodedJWTToken } from '$lib/server/helpers/sessions';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
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
