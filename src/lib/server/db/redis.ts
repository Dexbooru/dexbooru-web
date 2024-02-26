import { createClient } from 'redis';
import { REDIS_URL } from '../constants/database';

type RedisClientSingleton = Awaited<ReturnType<typeof redisClientSingleton>>;

const redisClientSingleton = async () => {
	return await createClient({
		url: REDIS_URL
	}).connect();
};

const globalForRedis = globalThis as unknown as {
	redis: RedisClientSingleton | undefined;
};

const redis = globalForRedis.redis ?? (await redisClientSingleton());

if (process.env.NODE_ENV !== 'production') {
	globalForRedis.redis = redis;
}

export default redis;
