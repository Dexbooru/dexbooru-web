import { dev } from '$app/environment';
import { PrismaClient } from '@prisma/client';


const prismaClientSingleton = () => {
	return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (dev) globalForPrisma.prisma = prisma;

export default prisma;
