import { building, dev } from '$app/environment';
import { DB_REDIS_PASSWORD, DB_REDIS_URL } from '$env/static/private';
import {
	createClient,
	type RedisClientOptions,
	type RedisFunctions,
	type RedisModules,
	type RedisScripts,
} from 'redis';

type RedisClient = ReturnType<typeof createClient>;

const redisClientSingleton = async () => {
	const connectionParams: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts> = {};
	if (DB_REDIS_URL.length > 0) {
		connectionParams.url = DB_REDIS_URL;
	}

	connectionParams.password = DB_REDIS_PASSWORD;

	const client = await createClient(connectionParams).connect();

	return client;
};

const mockRedisClient = {
	get: async () => null,
	set: async () => 'OK',
	del: async () => 1,
	sMembers: async () => [],
	sAdd: async () => 1,
	ping: async () => 'PONG',
} as unknown as RedisClient;

const globalForRedis = globalThis as unknown as {
	redis: RedisClient | undefined;
};

const redis = await (async () => {
	if (building) {
		return mockRedisClient;
	}
	if (globalForRedis.redis) {
		return globalForRedis.redis;
	}
	const client = await redisClientSingleton();
	if (dev) {
		globalForRedis.redis = client;
	}
	return client;
})();

export default redis;
