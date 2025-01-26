import { dev } from '$app/environment';
import { DB_REDIS_PASSWORD, DB_REDIS_URL } from '$env/static/private';
import {
	createClient,
	type RedisClientOptions,
	type RedisFunctions,
	type RedisModules,
	type RedisScripts,
} from 'redis';

const redisClientSingleton = async () => {
	const connectionParams: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts> = {};
	if (DB_REDIS_URL.length > 0) {
		connectionParams.url = DB_REDIS_URL;
	} else {
		connectionParams.password = DB_REDIS_PASSWORD;
	}

	const client = await createClient(connectionParams).connect();

	return client;
};

type RedisClientSingleton = ReturnType<typeof redisClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	redis: Awaited<RedisClientSingleton | undefined>;
};

const redis = globalForPrisma.redis ?? (await redisClientSingleton());

if (dev) globalForPrisma.redis = redis;

export default redis;
