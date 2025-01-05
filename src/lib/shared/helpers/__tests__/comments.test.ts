import type { TComment } from '$lib/shared/types/comments';
import { describe, expect, test } from 'vitest';
import CommentTree from '../comments';

describe('CommentTree', () => {
	test('initializes constructor properly', () => {
		const tree = new CommentTree();

		expect(tree.getCount()).toBe(0);
		expect(tree.getLevelOrder().length).toBe(0);
	});

	test('adds root comment nodes to the tree properly', () => {
		const tree = new CommentTree();
		const rootComment: TComment = {
			id: 'root-comment-id',
			parentCommentId: null,
			content: 'mock data',
			postId: 'test-post-id',
			author: {
				id: 'test-user-id',
				profilePictureUrl: 'url',
				username: 'test-user',
			},
			createdAt: new Date(),
			authorId: 'test-user-id',
		};
		tree.addComment(rootComment);
	});
});
