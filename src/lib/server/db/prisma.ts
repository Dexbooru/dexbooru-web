import { PrismaClient } from '@prisma/client';
import { cacheQuery } from '../helpers/database';

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const prismaClientSingleton = () => {
	return new PrismaClient().$extends({
		name: 'redis-query-cache',
		query: {
			post: {
				async findFirst({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				},
				async findMany({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				},
				async findUnique({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				}
			},
			tag: {
				async findFirst({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				},
				async findMany({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				},
				async findUnique({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				}
			},
			artist: {
				async findFirst({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				},
				async findMany({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				},
				async findUnique({ args, query }) {
					return await cacheQuery<typeof args>(args, query);
				}
			}
		}
	});
};

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
