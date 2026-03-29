import { vi } from 'vitest';

export const mockNewPostLikePublish = vi.fn().mockResolvedValue(undefined);

vi.mock('$lib/server/rabbitmq/publishers/newPostLike', () => ({
	default: {
		publish: (...args: unknown[]) => mockNewPostLikePublish(...args),
	},
	NewPostLikePublisher: {
		BASE_ROUTING_KEY: 'event.new_post_like.',
		buildRoutingKey: (postAuthorId: string) =>
			`event.new_post_like.${postAuthorId}`,
	},
}));
