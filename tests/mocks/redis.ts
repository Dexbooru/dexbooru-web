import { vi } from 'vitest';

export const mockRedis = {
	get: vi.fn(),
	set: vi.fn(),
	del: vi.fn(),
	sMembers: vi.fn(),
	sAdd: vi.fn(),
	connect: vi.fn(),
	quit: vi.fn(),
};
