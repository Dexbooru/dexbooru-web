import { vi } from 'vitest';

export const mockRedis = {
	get: vi.fn(),
	set: vi.fn(),
	del: vi.fn(),
	incr: vi.fn().mockResolvedValue(1),
	pExpire: vi.fn().mockResolvedValue(true),
	pTTL: vi.fn().mockResolvedValue(60_000),
	quit: vi.fn(),
	on: vi.fn(),
	connect: vi.fn(),
};

vi.mock('$lib/server/db/redis', () => ({
	default: mockRedis,
}));
