import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDefaultApplicationConfiguration } from '$lib/shared/applicationConfiguration';

const mockConfiguration = {
	...buildDefaultApplicationConfiguration(),
	maximumTagLength: 95,
};

vi.mock('$lib/server/applicationConfiguration/load', () => ({
	loadApplicationConfiguration: vi.fn(async () => mockConfiguration),
}));

vi.mock('$lib/server/applicationConfiguration/redis', () => ({
	getApplicationConfigurationFromRedis: vi.fn(async () => null),
	setApplicationConfigurationInRedis: vi.fn(async () => undefined),
	setupApplicationConfigurationRedisSubscription: vi.fn(async () => undefined),
}));

describe('application configuration cache', () => {
	beforeEach(async () => {
		vi.resetModules();
	});

	it('loads configuration from loader when cache is empty', async () => {
		const cache = await import('$lib/server/applicationConfiguration/cache');
		cache.invalidateApplicationConfigurationCache();

		const configuration = await cache.getApplicationConfiguration();
		expect(configuration.maximumTagLength).toBe(95);
	});

	it('returns synced value immediately after memory update', async () => {
		const cache = await import('$lib/server/applicationConfiguration/cache');
		cache.setApplicationConfigurationInMemory({
			maximumTagsPerPost: 21,
		});

		expect(cache.getApplicationConfigurationSync().maximumTagsPerPost).toBe(21);
	});
});
