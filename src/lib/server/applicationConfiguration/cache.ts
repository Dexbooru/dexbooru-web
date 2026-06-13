import {
	buildDefaultApplicationConfiguration,
	type TApplicationConfiguration,
	type TPartialApplicationConfiguration,
} from '$lib/shared/applicationConfiguration';
import { loadApplicationConfiguration } from './load';
import {
	getApplicationConfigurationFromRedis,
	setupApplicationConfigurationRedisSubscription,
	setApplicationConfigurationInRedis,
} from './redis';
import { applicationConfigurationEmitter } from '../events/applicationConfiguration';

let memoryApplicationConfiguration: TApplicationConfiguration =
	buildDefaultApplicationConfiguration();
let hasLoadedApplicationConfiguration = false;
let currentLoadPromise: Promise<TApplicationConfiguration> | null = null;
let hasBoundApplicationConfigurationEmitter = false;

export const getApplicationConfigurationSync = (): TApplicationConfiguration => {
	return memoryApplicationConfiguration;
};

export const setApplicationConfigurationInMemory = (
	configuration: TApplicationConfiguration | TPartialApplicationConfiguration,
) => {
	memoryApplicationConfiguration = {
		...memoryApplicationConfiguration,
		...configuration,
	};
	hasLoadedApplicationConfiguration = true;
};

export const invalidateApplicationConfigurationCache = () => {
	hasLoadedApplicationConfiguration = false;
	currentLoadPromise = null;
};

const getFreshApplicationConfiguration = async (): Promise<TApplicationConfiguration> => {
	const redisConfiguration = await getApplicationConfigurationFromRedis();
	if (redisConfiguration) {
		setApplicationConfigurationInMemory(redisConfiguration);
		return redisConfiguration;
	}

	const loadedConfiguration = await loadApplicationConfiguration();
	setApplicationConfigurationInMemory(loadedConfiguration);
	void setApplicationConfigurationInRedis(loadedConfiguration);
	return loadedConfiguration;
};

export const getApplicationConfiguration = async (): Promise<TApplicationConfiguration> => {
	if (hasLoadedApplicationConfiguration) return memoryApplicationConfiguration;
	if (currentLoadPromise) return await currentLoadPromise;

	currentLoadPromise = getFreshApplicationConfiguration();
	const loaded = await currentLoadPromise;
	currentLoadPromise = null;
	return loaded;
};

export const ensureApplicationConfigurationLoaded = async () => {
	await setupApplicationConfigurationRedisSubscription();
	if (!hasBoundApplicationConfigurationEmitter) {
		applicationConfigurationEmitter.on('updated', (configuration: TApplicationConfiguration) => {
			setApplicationConfigurationInMemory(configuration);
			void setApplicationConfigurationInRedis(configuration);
		});
		hasBoundApplicationConfigurationEmitter = true;
	}

	await getApplicationConfiguration();
};
