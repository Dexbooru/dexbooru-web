import { dev } from '$app/environment';
import { REDIS_CACHE_ENABLED } from '$env/static/private';
import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
import { PrismaClient } from '@prisma/client';
import { POST_CACHE_TIME_MS } from '../constants/posts';
import { determineCacheKey as determineArtistCacheKey } from './actions/artist';
import { determineCacheKey as determinePostCacheKey } from './actions/post';
import { determineCacheKey as determineTagCacheKey } from './actions/tag';
import redis from './redis';

type CacheOptions = {
	cachableOperations: string[];
	keyExpiryMs: number;
	determineKeyName?: (args: unknown, operation: string) => string | null;
};

const CACHE_OPTIONS: Record<string, CacheOptions> = {
	Post: {
		cachableOperations: ['findFirst', 'findUnique', 'findMany', 'update'],
		determineKeyName: determinePostCacheKey,
		keyExpiryMs: POST_CACHE_TIME_MS,
	},
	Tag: {
		cachableOperations: ['findFirst', 'findUnique', 'findMany'],
		determineKeyName: determineTagCacheKey,
		keyExpiryMs: 25_000,
	},
	Artist: {
		cachableOperations: ['findFirst', 'findUnique', 'findMany'],
		determineKeyName: determineArtistCacheKey,
		keyExpiryMs: 25_000,
	},
	Comment: {
		cachableOperations: ['findFirst', 'findUnique', 'findMany'],
		keyExpiryMs: 20_000,
	},
};

const prismaClientSingleton = () => {
	if (REDIS_CACHE_ENABLED === 'true') {
		return new PrismaClient().$extends({
			query: {
				$allOperations: async ({ model, args, query, operation }) => {
					if (!redis) {
						return await query(args);
					}

					const finalModel = model ?? '';
					const cacheOption = CACHE_OPTIONS[finalModel];
					if (
						CACHE_OPTIONS[finalModel] &&
						CACHE_OPTIONS[finalModel].cachableOperations.includes(operation)
					) {
						let fetchedSelectQueryResults: unknown;
						const selectQueryKey =
							typeof cacheOption?.determineKeyName === 'function'
								? cacheOption.determineKeyName(args, operation)
								: JSON.stringify(args);
						if (selectQueryKey) {
							const cachedSelectQueryResults = redis.isOpen
								? await redis.get(selectQueryKey)
								: null;
							if (cachedSelectQueryResults) {
								const convertedResults = JSON.parse(cachedSelectQueryResults);
								const adjustedConvertedResults =
									convertDataStructureToIncludeDatetimes(convertedResults);
								return adjustedConvertedResults;
							}

							fetchedSelectQueryResults = await query(args);
							redis.set(selectQueryKey, JSON.stringify(fetchedSelectQueryResults), {
								PX: CACHE_OPTIONS[finalModel]?.keyExpiryMs ?? 0,
							});
						} else {
							fetchedSelectQueryResults = await query(args);
						}

						return fetchedSelectQueryResults;
					}

					return await query(args);
				},
			},
		});
	}

	return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (dev) globalForPrisma.prisma = prisma;

export default prisma;
