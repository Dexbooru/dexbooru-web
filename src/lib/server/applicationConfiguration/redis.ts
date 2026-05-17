import type { TApplicationConfiguration } from '$lib/shared/applicationConfiguration';
import {
	APPLICATION_CONFIGURATION_CACHE_KEY,
	APPLICATION_CONFIGURATION_REDIS_CHANNEL,
} from '../constants/applicationConfiguration';
import redis from '../db/redis';
import logger from '../logging/logger';
import { applicationConfigurationEmitter } from '../events/applicationConfiguration';

export const getApplicationConfigurationFromRedis =
	async (): Promise<TApplicationConfiguration | null> => {
		try {
			const cachedConfiguration = await redis.get(APPLICATION_CONFIGURATION_CACHE_KEY);
			if (!cachedConfiguration) return null;
			const parsed = JSON.parse(cachedConfiguration) as TApplicationConfiguration;
			return {
				...parsed,
				createdAt: new Date(parsed.createdAt),
				updatedAt: new Date(parsed.updatedAt),
			};
		} catch (error) {
			logger.error('Could not read application configuration from redis cache.', error);
			return null;
		}
	};

export const setApplicationConfigurationInRedis = async (
	configuration: TApplicationConfiguration,
) => {
	try {
		await redis.set(APPLICATION_CONFIGURATION_CACHE_KEY, JSON.stringify(configuration));
	} catch (error) {
		logger.error('Could not set application configuration in redis cache.', error);
	}
};

export const publishApplicationConfigurationUpdate = async (
	configuration: TApplicationConfiguration,
) => {
	try {
		await redis.publish(APPLICATION_CONFIGURATION_REDIS_CHANNEL, JSON.stringify(configuration));
	} catch (error) {
		logger.error('Could not publish application configuration update.', error);
	}
};

let hasConfiguredApplicationConfigurationSubscription = false;
let applicationConfigurationSubscriber: typeof redis | null = null;

export const setupApplicationConfigurationRedisSubscription = async () => {
	if (hasConfiguredApplicationConfigurationSubscription) return;

	try {
		applicationConfigurationSubscriber = applicationConfigurationSubscriber ?? redis.duplicate();
		if (!applicationConfigurationSubscriber.isOpen) {
			await applicationConfigurationSubscriber.connect();
		}
		await applicationConfigurationSubscriber.subscribe(
			APPLICATION_CONFIGURATION_REDIS_CHANNEL,
			(message) => {
				try {
					const payload = JSON.parse(message) as TApplicationConfiguration;
					const hydratedPayload = {
						...payload,
						createdAt: new Date(payload.createdAt),
						updatedAt: new Date(payload.updatedAt),
					};
					applicationConfigurationEmitter.emitUpdated(hydratedPayload);
				} catch (error) {
					logger.error('Failed to parse application configuration pub/sub payload.', error);
				}
			},
		);
		hasConfiguredApplicationConfigurationSubscription = true;
	} catch (error) {
		logger.error('Failed to subscribe to application configuration updates.', error);
	}
};
