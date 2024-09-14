import { createClient } from "redis";

const redisClientSingleton = async () => {
    const client = await createClient({
        password: process.env.DB_REDIS_PASSWORD ?? '',
    }).connect();
    return client;
};

type RedisClientSingleton = ReturnType<typeof redisClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    redis: Awaited<RedisClientSingleton | undefined>;
};

const redis = globalForPrisma.redis ?? await redisClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.redis = redis;

export default redis;
