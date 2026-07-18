import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/server/events/uploadStatus');
vi.unmock('$lib/server/db/redis');

vi.mock('$lib/server/db/redis', () => {
	const client = {
		publish: vi.fn(async () => 0),
		duplicate: () => client,
		connect: vi.fn(async () => client),
		subscribe: vi.fn(async () => undefined),
		isOpen: true,
	};
	return { default: client };
});

vi.mock('$lib/server/logging/logger', () => ({
	default: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

describe('uploadStatus events', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.resetModules();
	});

	it('resolves waitForUploadCompletion when a completed event arrives', async () => {
		const { emitUploadCompleted, waitForUploadCompletion } =
			await import('$lib/server/events/uploadStatus');

		const uploadId = crypto.randomUUID();
		const waitPromise = waitForUploadCompletion(uploadId, 2_000);

		await emitUploadCompleted(uploadId, {
			imageUrls: ['https://cdn.example/posts/a_original'],
			imageWidths: [100],
			imageHeights: [80],
			imageHashes: ['abc'],
		});

		await expect(waitPromise).resolves.toEqual({
			imageUrls: ['https://cdn.example/posts/a_original'],
			imageWidths: [100],
			imageHeights: [80],
			imageHashes: ['abc'],
		});
	});

	it('rejects waitForUploadCompletion when a failed event arrives', async () => {
		const { emitUploadFailure, waitForUploadCompletion } =
			await import('$lib/server/events/uploadStatus');

		const uploadId = crypto.randomUUID();
		const waitPromise = waitForUploadCompletion(uploadId, 2_000);

		await emitUploadFailure(uploadId, 'Image processing failed. Please try again.');

		await expect(waitPromise).rejects.toThrow('Image processing failed. Please try again.');
	});

	it('emits progress events locally', async () => {
		const { emitUploadProgress, emitLocalUploadStatus, uploadStatusEmitter } =
			await import('$lib/server/events/uploadStatus');

		const uploadId = crypto.randomUUID();
		const messages: string[] = [];

		const onEvent = (event: { kind: string; message?: string }) => {
			if (event.kind === 'progress' && event.message) {
				messages.push(event.message);
			}
		};

		uploadStatusEmitter.on(uploadId, onEvent);

		await emitUploadProgress(uploadId, 'Hashing original files...');
		emitLocalUploadStatus({
			uploadId,
			kind: 'progress',
			message: 'Processing images...',
		});

		uploadStatusEmitter.off(uploadId, onEvent);

		expect(messages).toEqual(['Hashing original files...', 'Processing images...']);
	});
});
