import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';
import {
	hasUserLikedPost,
	deletePostById,
	updatePost,
	findPostsByPage,
	findPostById,
	likePostById,
	createPost,
	findSimilarPosts,
} from '$lib/server/db/actions/post';

describe('post actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('hasUserLikedPost', () => {
		it('should return true if post is liked by user', async () => {
			mockPrisma.post.findFirst.mockResolvedValue({ id: 'p1' });
			const result = await hasUserLikedPost('u1', 'p1');
			expect(result).toBe(true);
			expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
				where: {
					id: 'p1',
					likedBy: { some: { id: 'u1' } },
				},
			});
		});
	});

	describe('deletePostById', () => {
		it('should call prisma.post.delete and decrement counts', async () => {
			const postId = 'p1';
			const mockPost = {
				id: postId,
				tags: [{ name: 't1' }],
				artists: [{ name: 'a1' }],
			};
			mockPrisma.post.delete.mockResolvedValue(mockPost);

			await deletePostById(postId);

			expect(mockPrisma.post.delete).toHaveBeenCalledWith({
				where: { id: postId },
				select: expect.any(Object),
			});
			expect(mockPrisma.tag.updateMany).toHaveBeenCalled();
			expect(mockPrisma.artist.updateMany).toHaveBeenCalled();
		});
	});

	describe('updatePost', () => {
		it('should call prisma.post.update with correct arguments', async () => {
			const postId = 'p1';
			const newData = { description: 'new' };
			mockPrisma.post.update.mockResolvedValue({ id: postId, ...newData });

			await updatePost(postId, newData);

			expect(mockPrisma.post.update).toHaveBeenCalledWith({
				where: { id: postId },
				data: {
					...newData,
					updatedAt: expect.any(Date),
				},
			});
		});
	});

	describe('findPostsByPage', () => {
		it('should call prisma.post.findMany with correct arguments', async () => {
			mockPrisma.post.findMany.mockResolvedValue([]);
			await findPostsByPage(1, 10, 'createdAt', false);

			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: { moderationStatus: { in: ['PENDING', 'APPROVED'] } },
				skip: 10,
				take: 10,
				orderBy: { createdAt: 'desc' },
				select: undefined,
			});
		});
	});

	describe('findPostById', () => {
		it('should call prisma.post.findUnique with correct arguments', async () => {
			const postId = 'p1';
			const mockPost = { id: postId };
			mockPrisma.post.findUnique.mockResolvedValue(mockPost);

			const result = await findPostById(postId);

			expect(result).toEqual(mockPost);
			expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
				relationLoadStrategy: 'join',
				where: {
					id: postId,
					moderationStatus: { in: ['PENDING', 'APPROVED'] },
				},
				select: undefined,
			});
		});
	});

	describe('likePostById', () => {
		it('should call prisma.post.update with increment for like', async () => {
			mockPrisma.post.update.mockResolvedValue({ id: 'p1' });
			await likePostById('p1', 'like', 'u1');

			expect(mockPrisma.post.update).toHaveBeenCalledWith({
				where: { id: 'p1' },
				data: {
					updatedAt: expect.any(Date),
					likes: { increment: 1 },
					likedBy: { connect: { id: 'u1' } },
				},
			});
		});

		it('should call prisma.post.update with decrement for dislike', async () => {
			mockPrisma.post.update.mockResolvedValue({ id: 'p1' });
			await likePostById('p1', 'dislike', 'u1');

			expect(mockPrisma.post.update).toHaveBeenCalledWith({
				where: { id: 'p1' },
				data: {
					updatedAt: expect.any(Date),
					likes: { decrement: 1 },
					likedBy: { disconnect: { id: 'u1' } },
				},
			});
		});
	});

	describe('createPost', () => {
		it('should call prisma.post.create and increment counts', async () => {
			mockPrisma.post.create.mockResolvedValue({ id: 'new-p' });
			await createPost('source', 'desc', false, ['t1'], ['a1'], ['url'], [100], [100], ['hash'], 'u1');

			expect(mockPrisma.post.create).toHaveBeenCalled();
			expect(mockPrisma.tag.updateMany).toHaveBeenCalled();
			expect(mockPrisma.artist.updateMany).toHaveBeenCalled();
		});
	});

	describe('findSimilarPosts', () => {
		it('should return empty if tags and artists are empty', async () => {
			const result = await findSimilarPosts('p1', '', '');
			expect(result.posts).toEqual([]);
		});

		it('should call prisma.post.findMany with OR statements', async () => {
			mockPrisma.post.findMany.mockResolvedValue([
				{ id: 'p2', tagString: 't1', artistString: 'a1' },
			]);
			await findSimilarPosts('p1', 't1', 'a1');

			expect(mockPrisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
				where: expect.objectContaining({
					OR: expect.arrayContaining([
						{ tagString: { contains: 't1' } },
						{ artistString: { contains: 'a1' } },
					]),
				}),
				take: 6,
			}));
		});
	});
});
