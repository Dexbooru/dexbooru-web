import { dev } from '$app/environment';
import { DB_REDIS_PASSWORD, REDIS_CACHE_ENABLED } from '$env/static/private';
import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
import { createClient } from 'redis';


const redisClientSingleton = async () => {
	if (REDIS_CACHE_ENABLED === 'false') return null;

	const client = await createClient({
		password: DB_REDIS_PASSWORD,
	}).connect();
	return client;
};

export const getKey = async (key: string) => {
	if (!redis) return null;

	const value = await redis.get(key);
	if (!value) return null;
	return convertDataStructureToIncludeDatetimes(JSON.parse(value));
}

export const setValue = async (key: string, value: unknown, expirationInSeconds: number) => {
	if (!redis) return;

	if (typeof value === 'string') {
		await redis.set(key, value, 'EX', expirationInSeconds);
	}

	if (value instanceof Array) {
		await redis.lPush(key, ...value);
	}

	if (typeof value === 'object') {
		await redis.set(key, JSON.stringify(value), 'EX', expirationInSeconds);
	}
};


type RedisClientSingleton = ReturnType<typeof redisClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	redis: Awaited<RedisClientSingleton | undefined>;
};

const redis = globalForPrisma.redis ?? (await redisClientSingleton());

if (dev) globalForPrisma.redis = redis;

export default redis;
