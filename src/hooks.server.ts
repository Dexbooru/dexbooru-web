import { getUserClaimsFromEncodedJWTToken } from '$lib/server/helpers/sessions';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const userJwtTokenEncoded = event.cookies.get(SESSION_ID_KEY);
	if (userJwtTokenEncoded) {
		const sessionUser = getUserClaimsFromEncodedJWTToken(userJwtTokenEncoded);
		event.locals.user = sessionUser ?? NULLABLE_USER;
	} else {
		event.locals.user = NULLABLE_USER;
	}

	return await resolve(event);
};


export const handleError: HandleServerError = async ({ error }) => {
	const errorMessage = process.env.NODE_ENV?.startsWith('dev') ? (error as Error).toString() : 'Internal Server Error';
	return {
		message: errorMessage
	};
};