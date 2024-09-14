import { convertDataStructureToIncludeDatetimes } from '$lib/shared/helpers/dates';
import { PrismaClient } from '@prisma/client';
import redis from './redis';

const CACHABLE_MODELS: string[] = ['Post'];

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
						const adjustedConvertedResults = convertDataStructureToIncludeDatetimes(Array.isArray(convertedResults) ? convertedResults : [convertedResults], ['createdAt', 'updatedAt'])
						return adjustedConvertedResults;
					}

					const fetchedSelectQueryResults = await query(args);
					redis.set(selectQueryKey, JSON.stringify(fetchedSelectQueryResults));

					return fetchedSelectQueryResults;
				}

				return await query(args);
			}
		}
	});
	return client;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
