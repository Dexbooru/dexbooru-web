import { dev } from '$app/environment';
import { populateAuthenticatedUser } from '$lib/server/helpers/controllers';
import logger from '$lib/server/logging/logger';
import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	logger.info(event);

	populateAuthenticatedUser(event);
	return await resolve(event);
};

export const handleError: HandleServerError = async ({ error }) => {
	logger.error((error as Error).toString());

	const errorMessage = dev ? (error as Error).toString() : 'Internal Server Error';
	return {
		message: errorMessage,
	};
};
