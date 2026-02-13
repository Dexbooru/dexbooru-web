import { vi } from 'vitest';
import { mockPrisma } from './mocks/prisma';
import { mockRedis } from './mocks/redis';

vi.mock('$lib/server/db/prisma', () => ({
	default: mockPrisma,
}));

vi.mock('$lib/server/db/redis', () => ({
	default: mockRedis,
}));
