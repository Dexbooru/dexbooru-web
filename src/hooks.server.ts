import { dev } from '$app/environment';
import { populateAuthenticatedUser } from '$lib/server/helpers/controllers';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	populateAuthenticatedUser(event);
	return await resolve(event);
};

export const handleError: HandleServerError = async ({ error }) => {
	const errorMessage = dev ? (error as Error).toString() : 'Internal Server Error';
	return {
		message: errorMessage,
	};
};
