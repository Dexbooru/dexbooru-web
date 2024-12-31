import { dev } from '$app/environment';
import { DB_REDIS_PASSWORD } from '$env/static/private';
import { createClient } from 'redis';

const redisClientSingleton = async () => {
	const client = await createClient({
		password: DB_REDIS_PASSWORD,
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
