import { building, dev } from '$app/environment';
import { ensureApplicationConfigurationLoaded } from '$lib/server/applicationConfiguration';
import { populateAuthenticatedUser } from '$lib/server/helpers/controllers';
import logger from '$lib/server/logging/logger';
import { runStartupPreflightChecks } from '$lib/server/preflight';
import { ensureUploadPipelineBootstrapped } from '$lib/server/uploads/bootstrap';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';

export const init: ServerInit = async () => {
	if (building) return;
	await runStartupPreflightChecks();
};

export const handle: Handle = async ({ event, resolve }) => {
	logger.info(event);

	await ensureApplicationConfigurationLoaded();
	await ensureUploadPipelineBootstrapped();
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
