import { vi } from 'vitest';

export const mockRedis = {
	get: vi.fn(),
	set: vi.fn(),
	del: vi.fn(),
	quit: vi.fn(),
	on: vi.fn(),
	connect: vi.fn(),
};

vi.mock('$lib/server/db/redis', () => ({
	default: mockRedis,
}));
