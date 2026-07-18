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
	publish: vi.fn().mockResolvedValue(0),
	subscribe: vi.fn(),
	duplicate: vi.fn(),
	zAdd: vi.fn().mockResolvedValue(1),
	zRem: vi.fn().mockResolvedValue(0),
	zRange: vi.fn().mockResolvedValue([]),
	zRank: vi.fn().mockResolvedValue(0),
	zCard: vi.fn().mockResolvedValue(0),
	isOpen: true,
};

mockRedis.duplicate.mockReturnValue(mockRedis);

vi.mock('$lib/server/db/redis', () => ({
	default: mockRedis,
}));
