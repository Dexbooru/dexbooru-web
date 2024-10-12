import { dev } from '$app/environment';
import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
import { PrismaClient } from '@prisma/client';
import redis from './redis';

type CacheOptions = {
	keyExpiryMs: number;
};

const CACHABLE_MODELS: string[] = ['Post', 'Artist', 'Tag', 'Comment'];
const CACHE_OPTIONS: Record<string, CacheOptions> = {
	Post: {
		keyExpiryMs: 10_000,
	},
	Tag: {
		keyExpiryMs: 25_000,
	},
	Artist: {
		keyExpiryMs: 25_000,
	},
	Comment: {
		keyExpiryMs: 20_000,
	},
};

const prismaClientSingleton = () => {
	const client = new PrismaClient().$extends({
		query: {
			$allOperations: async ({ model, args, query, operation }) => {
				const isSelectQuery = operation.toLocaleLowerCase().includes('find');
				const isCachableModel = CACHABLE_MODELS.includes(model ?? '');
				if (isSelectQuery && isCachableModel) {
					const selectQueryKey = JSON.stringify(args);
					const cachedSelectQueryResults = redis.isOpen ? await redis.get(selectQueryKey) : null;
					if (cachedSelectQueryResults) {
						const convertedResults = JSON.parse(cachedSelectQueryResults);
						const adjustedConvertedResults =
							convertDataStructureToIncludeDatetimes(convertedResults);
						return adjustedConvertedResults;
					}

					const fetchedSelectQueryResults = await query(args);
					redis.set(selectQueryKey, JSON.stringify(fetchedSelectQueryResults), {
						PX: CACHE_OPTIONS[model ?? '']?.keyExpiryMs ?? 0,
					});

					return fetchedSelectQueryResults;
				}

				return await query(args);
			},
		},
	});

	return client;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (dev) globalForPrisma.prisma = prisma;

export default prisma;
