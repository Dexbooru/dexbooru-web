import { vi } from 'vitest';

export const mockUploadStatusEmitter = {
	emit: vi.fn(),
	on: vi.fn(),
	off: vi.fn(),
	removeAllListeners: vi.fn(),
};

export const mockUploadStatus = {
	uploadStatusEmitter: mockUploadStatusEmitter,
	emitLocalUploadStatus: vi.fn(),
	emitUploadProgress: vi.fn(),
	emitUploadCompleted: vi.fn(),
	emitUploadFailure: vi.fn(),
	waitForUploadCompletion: vi.fn(),
	setupUploadStatusRedisSubscription: vi.fn(),
};

vi.mock('$lib/server/events/uploadStatus', () => mockUploadStatus);
