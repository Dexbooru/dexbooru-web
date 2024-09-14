import { getUserClaimsFromEncodedJWTToken } from '$lib/server/helpers/sessions';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import type { Handle, HandleServerError } from '@sveltejs/kit';

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


export const handleError: HandleServerError = async ({ error }) => {
	const errorMessage = process.env.NODE_ENV?.startsWith('dev') ? (error as Error).toString() : 'Internal Server Error';

	return {
		message: errorMessage
	};
};