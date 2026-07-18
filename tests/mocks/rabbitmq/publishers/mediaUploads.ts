import { vi } from 'vitest';

export const mockMediaUploadsPublish = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/server/rabbitmq/publishers/mediaUploads', () => ({
	MediaUploadsPublisher: {
		ROUTING_KEY: 'media_uploads',
	},
	default: {
		publish: mockMediaUploadsPublish,
	},
}));
