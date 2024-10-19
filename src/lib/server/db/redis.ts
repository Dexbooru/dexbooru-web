import { dev } from '$app/environment';
import { REDIS_CACHE_ENABLED } from '$env/static/private';
import { createClient } from 'redis';

const redisClientSingleton = async () => {
	if (REDIS_CACHE_ENABLED === 'false') return null;
	const client = await createClient({
		password: process.env.DB_REDIS_PASSWORD ?? '',
	}).connect();
	return client;
};

type RedisClientSingleton = ReturnType<typeof redisClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	redis: Awaited<RedisClientSingleton | undefined>;
};

const redis = globalForPrisma.redis ?? (await redisClientSingleton());

if (dev) globalForPrisma.redis = redis;

export default redis;
