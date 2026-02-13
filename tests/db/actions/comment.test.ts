import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';
import {
	findComments,
	findCommentById,
	editCommentContentById,
	deleteCommentById,
	createComment,
} from '$lib/server/db/actions/comment';

describe('comment actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('findComments', () => {
		it('should call prisma.comment.findMany with correct arguments', async () => {
			const pageNumber = 1;
			const orderBy = 'createdAt';
			const ascending = false;
			mockPrisma.comment.findMany.mockResolvedValue([]);

			await findComments(pageNumber, orderBy, ascending);

			expect(mockPrisma.comment.findMany).toHaveBeenCalledWith({
				select: undefined,
				skip: pageNumber * 35,
				take: 35,
				orderBy: { [orderBy]: 'desc' },
			});
		});
	});

	describe('findCommentById', () => {
		it('should call prisma.comment.findFirst with correct arguments', async () => {
			const commentId = 'comm1';
			const mockComment = { id: commentId, content: 'test' };
			mockPrisma.comment.findFirst.mockResolvedValue(mockComment);

			const result = await findCommentById(commentId);

			expect(result).toEqual(mockComment);
			expect(mockPrisma.comment.findFirst).toHaveBeenCalledWith({
				relationLoadStrategy: 'join',
				where: { id: commentId },
				select: undefined,
			});
		});
	});

	describe('editCommentContentById', () => {
		it('should call prisma.comment.update with correct arguments', async () => {
			const commentId = 'comm1';
			const updatedContent = 'new content';
			mockPrisma.comment.update.mockResolvedValue({ id: commentId, content: updatedContent });

			await editCommentContentById(commentId, updatedContent);

			expect(mockPrisma.comment.update).toHaveBeenCalledWith({
				where: { id: commentId },
				data: {
					content: updatedContent,
					updatedAt: expect.any(Date),
				},
				select: {
					id: true,
					content: true,
					updatedAt: true,
				},
			});
		});
	});

	describe('deleteCommentById', () => {
		it('should call prisma.comment.delete and update parent/post counts', async () => {
			const commentId = 'comm1';
			const postId = 'post1';
			const parentCommentId = 'parent1';
			mockPrisma.comment.delete.mockResolvedValue({ id: commentId, parentCommentId });

			await deleteCommentById(commentId, postId);

			expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
				where: { id: commentId },
			});
			expect(mockPrisma.comment.update).toHaveBeenCalledWith({
				where: { id: parentCommentId },
				data: { replyCount: { decrement: 1 } },
			});
			expect(mockPrisma.post.update).toHaveBeenCalledWith({
				where: { id: postId },
				data: { commentCount: { decrement: 1 } },
			});
		});
	});

	describe('createComment', () => {
		it('should call prisma.comment.create and update counts', async () => {
			const authorId = 'user1';
			const postId = 'post1';
			const content = 'content';
			const parentCommentId = 'parent1';
			mockPrisma.comment.create.mockResolvedValue({ id: 'new-comm' });

			await createComment(authorId, postId, content, parentCommentId);

			expect(mockPrisma.comment.create).toHaveBeenCalledWith({
				data: {
					authorId,
					postId,
					content,
					parentCommentId,
				},
			});
			expect(mockPrisma.comment.update).toHaveBeenCalledWith({
				where: { id: parentCommentId },
				data: { replyCount: { increment: 1 } },
			});
			expect(mockPrisma.post.update).toHaveBeenCalledWith({
				where: { id: postId },
				data: { commentCount: { increment: 1 } },
			});
		});
	});
});
