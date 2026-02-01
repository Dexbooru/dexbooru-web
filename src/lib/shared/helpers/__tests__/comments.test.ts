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
				role: 'USER',
			},
			createdAt: new Date(),
			updatedAt: new Date(),
			replyCount: 0,
			authorId: 'test-user-id',
		};
		tree.addComment(rootComment);
	});

	test('searches comments properly', () => {
		const tree = new CommentTree();
		const comment1: TComment = {
			id: '1',
			parentCommentId: null,
			content: 'Hello World',
			postId: 'p1',
			author: { id: 'u1', username: 'user1', profilePictureUrl: '', role: 'USER' },
			createdAt: new Date(),
			authorId: 'u1',
			updatedAt: new Date(),
			replyCount: 0,
		};
		const comment2: TComment = {
			id: '2',
			parentCommentId: '1',
			content: 'FOO BAR',
			postId: 'p1',
			author: { id: 'u2', username: 'user2', profilePictureUrl: '', role: 'USER' },
			createdAt: new Date(),
			authorId: 'u2',
			updatedAt: new Date(),
			replyCount: 0,
		};

		tree.addComment(comment1);
		tree.addComment(comment2);

		expect(tree.search('hello').length).toBe(1);
		expect(tree.search('hello')[0].id).toBe('1');
		expect(tree.search('foo').length).toBe(1);
		expect(tree.search('foo')[0].id).toBe('2');
		expect(tree.search('BAR').length).toBe(1);
		expect(tree.search('BAR')[0].id).toBe('2');
		expect(tree.search('xyz').length).toBe(0);
	});

	test('compares comments correctly', () => {
		const t1 = new Date('2023-01-01');
		const t2 = new Date('2023-01-02');
		const c1 = { createdAt: t1 } as TComment;
		const c2 = { createdAt: t2 } as TComment;

		// Newer (t2) should come before Older (t1) -> return -1
		expect(CommentTree.compareComments(c2, c1)).toBe(-1);
		expect(CommentTree.compareComments(c1, c2)).toBe(1);
		expect(CommentTree.compareComments(c1, c1)).toBe(0);
	});

	test('edits comment', () => {
		const tree = new CommentTree();
		const c1: TComment = {
			id: '1',
			parentCommentId: null,
			content: 'Original',
			postId: 'p',
			author: { id: 'u', username: 'u', profilePictureUrl: '', role: 'USER' },
			createdAt: new Date(),
			updatedAt: new Date(),
			authorId: 'u',
			replyCount: 0,
		};
		tree.addComment(c1);

		const newTime = new Date();
		const result = tree.editComment('1', 'New', newTime);
		expect(result).toBe(true);

		const stored = tree.getReplies('root')[0];
		expect(stored.content).toBe('New');
		expect(stored.updatedAt).toBe(newTime);

		expect(tree.editComment('999', 'x', newTime)).toBe(false);
	});

	test('deletes comment recursively', () => {
		const tree = new CommentTree();
		const c1 = {
			id: '1',
			parentCommentId: null,
			content: '1',
			createdAt: new Date(),
			updatedAt: new Date(),
		} as TComment;
		const c2 = {
			id: '2',
			parentCommentId: '1',
			content: '2',
			createdAt: new Date(),
			updatedAt: new Date(),
		} as TComment;

		tree.addComment(c1);
		tree.addComment(c2);
		expect(tree.getCount()).toBe(2);

		tree.deleteComment('1');
		expect(tree.getCount()).toBe(0);
		expect(tree.getReplies('root')).toEqual([]);
	});

	test('gets replies', () => {
		const tree = new CommentTree();
		const c1 = {
			id: '1',
			parentCommentId: null,
			createdAt: new Date('2023-01-01'),
		} as TComment;
		const c2 = {
			id: '2',
			parentCommentId: null,
			createdAt: new Date('2023-01-02'),
		} as TComment;

		tree.addComment(c1);
		tree.addComment(c2);

		const replies = tree.getReplies('root');
		expect(replies.map((c) => c.id)).toEqual(['2', '1']); // Sorted by date desc
		expect(tree.getReplies('1')).toEqual([]);
		expect(tree.getReplies('non-existent')).toEqual([]);
	});

	test('gets level order', () => {
		const tree = new CommentTree();
		const c1 = { id: '1', parentCommentId: null, createdAt: new Date() } as TComment;
		const c2 = { id: '2', parentCommentId: '1', createdAt: new Date() } as TComment;

		tree.addComment(c1);
		tree.addComment(c2);

		const order = tree.getLevelOrder();
		expect(order.map((c) => c.id)).toEqual(['1', '2']);
	});

	test('gets count', () => {
		const tree = new CommentTree();
		expect(tree.getCount()).toBe(0);
		tree.addComment({ id: '1', parentCommentId: null } as TComment);
		expect(tree.getCount()).toBe(1);
	});
});
