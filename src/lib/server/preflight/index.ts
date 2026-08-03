import { building } from '$app/environment';
import { assertS3BucketsReachable } from '../aws/actions/s3';
import logger from '../logging/logger';
import { assertWorkerModulesReady } from '../workers/workerModules';

const shouldSkipStartupPreflight = (): boolean => {
	if (building) return true;
	if (process.env.VITEST) return true;
	return false;
};

export const runStartupPreflightChecks = async (): Promise<void> => {
	if (shouldSkipStartupPreflight()) {
		logger.info('Skipping startup preflight checks', {
			building,
			vitest: Boolean(process.env.VITEST),
		});
		return;
	}

	logger.info('Running startup preflight checks');
	await assertS3BucketsReachable();
	await assertWorkerModulesReady();
	logger.info('Startup preflight checks passed');
};
