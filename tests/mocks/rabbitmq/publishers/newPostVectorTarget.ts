import { vi } from 'vitest';

export const mockNewPostVectorTargetPublish = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/server/rabbitmq/publishers/newPostVectorTarget', () => ({
	default: {
		publish: (...args: unknown[]) => mockNewPostVectorTargetPublish(...args),
	},
	NewPostVectorTargetPublisher: {
		ROUTING_KEY: 'new_post.vector_target',
	},
}));
