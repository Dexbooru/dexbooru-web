import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TMediaUploadJob } from '$lib/server/types/upload';

vi.unmock('$lib/server/rabbitmq/publishers/mediaUploads');

vi.mock('$lib/server/rabbitmq/client', () => ({
	default: null,
}));

describe('MediaUploadsPublisher', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('maps job payloads to the wire DTO', async () => {
		const { MediaUploadsPublisher } = await import('$lib/server/rabbitmq/publishers/mediaUploads');
		const publisher = Object.create(MediaUploadsPublisher.prototype) as InstanceType<
			typeof MediaUploadsPublisher
		>;

		const job: TMediaUploadJob = {
			uploadId: 'upload-1',
			resourceType: 'posts',
			isNsfw: true,
			images: [
				{
					index: 0,
					tempObjectKey: 'uploads/posts/upload-1/0',
					contentType: 'image/png',
					sha256: 'hash',
				},
			],
		};

		expect(publisher.toMessageDto(job)).toEqual(job);
	});
});
