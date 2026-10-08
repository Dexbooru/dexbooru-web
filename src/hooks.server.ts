import { setInterval } from 'node:timers';
import { building, dev } from '$app/environment';
import { ensureApplicationConfigurationLoaded } from '$lib/server/applicationConfiguration';
import { SAUCENAO_INDEX_CATALOG_SYNC_INTERVAL_MS } from '$lib/server/constants/sauceNao';
import { populateAuthenticatedUser } from '$lib/server/helpers/controllers';
import { syncSauceNaoIndexCatalog } from '$lib/server/helpers/sauceNao/indexCatalog';
import logger from '$lib/server/logging/logger';
import { runStartupPreflightChecks } from '$lib/server/preflight';
import { ensureUploadPipelineBootstrapped } from '$lib/server/uploads/bootstrap';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';

const syncSauceNaoIndexCatalogInBackground = () => {
	void syncSauceNaoIndexCatalog().catch((error) => {
		logger.error('Could not sync SauceNAO index catalog.', error);
	});
};

export const init: ServerInit = async () => {
	if (building) return;
	await runStartupPreflightChecks();
	syncSauceNaoIndexCatalogInBackground();
	const timer = setInterval(
		syncSauceNaoIndexCatalogInBackground,
		SAUCENAO_INDEX_CATALOG_SYNC_INTERVAL_MS,
	);
	timer.unref();
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
