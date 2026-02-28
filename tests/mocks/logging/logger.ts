import { vi } from 'vitest';

export const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

vi.mock('$lib/server/logging/logger', () => ({
	default: mockLogger,
}));
