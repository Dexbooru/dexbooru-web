import { vi } from 'vitest';

export const mockUploadStatusEmitter = {
	emit: vi.fn(),
	on: vi.fn(),
	off: vi.fn(),
};

vi.mock('$lib/server/events/uploadStatus', () => ({
	uploadStatusEmitter: mockUploadStatusEmitter,
}));
