import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enrichNotifications } from '$lib/server/helpers/notifications/enrichNotifications';
import { mockCommentActions, mockPostActions } from '../../../../mocks';
import type { TRealtimeNotification } from '$lib/shared/types/notifcations';

vi.mock('$lib/server/db/prisma', () => ({
	default: {
		user: {
			findMany: vi.fn(),
		},
	},
}));

import prisma from '$lib/server/db/prisma';

describe('enrichNotifications', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPostActions.findPostsByIds.mockResolvedValue([]);
		mockCommentActions.findCommentsByIds.mockResolvedValue([]);
	});

	it('loads comment content and first post image url from postgres', async () => {
		const notifications: TRealtimeNotification[] = [
			{
				_id: 'n1',
				createdAt: '2024-01-01T00:00:00.000Z',
				type: 'new_post_comment',
				commentId: 'c1',
				postId: 'p1',
				postAuthorId: 'author-1',
				commentAuthorId: 'commenter-1',
				parentCommentId: null,
				parentCommentAuthorId: null,
				wasRead: false,
			},
		];

		vi.mocked(prisma.user.findMany).mockResolvedValue([
			{
				id: 'commenter-1',
				username: 'alice',
				profilePictureUrl: 'https://cdn.example/alice.webp',
			},
		] as never);
		mockCommentActions.findCommentsByIds.mockResolvedValue([
			{ id: 'c1', content: '<p>Fresh content from postgres</p>' },
		]);
		mockPostActions.findPostsByIds.mockResolvedValue([
			{
				id: 'p1',
				imageUrls: [
					'https://cdn.example/post-1.webp',
					'https://cdn.example/post-2.webp',
				],
			},
		]);

		const enriched = await enrichNotifications(notifications);

		expect(mockCommentActions.findCommentsByIds).toHaveBeenCalledWith(['c1'], {
			id: true,
			content: true,
		});
		expect(mockPostActions.findPostsByIds).toHaveBeenCalledWith(['p1'], {
			id: true,
			imageUrls: true,
		});
		expect(enriched[0]).toMatchObject({
			type: 'new_post_comment',
			commentAuthorUsername: 'alice',
			commentContent: '<p>Fresh content from postgres</p>',
			postImageUrl: 'https://cdn.example/post-1.webp',
		});
	});
});
