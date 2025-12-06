import { dev } from '$app/environment';
import { PrismaClient } from '$generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
	const adapter = new PrismaPg({
		connectionString: process.env.DATABASE_URL ?? '',
	});
	return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (dev) globalForPrisma.prisma = prisma;

export default prisma;
