import type { PostSourceType } from '$generated/prisma/client';
import {
	createPostSource,
	createPostSources,
	getPostSourcesByPostId,
} from '$lib/server/db/actions/postSource';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';

describe('postSource actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getPostSourcesByPostId', () => {
		it('should call prisma.postSource.findMany with posts relation filter', async () => {
			const postId = 'p1';
			mockPrisma.postSource.findMany.mockResolvedValue([]);
			await getPostSourcesByPostId(postId);
			expect(mockPrisma.postSource.findMany).toHaveBeenCalledWith({
				where: {
					posts: {
						some: { id: postId },
					},
				},
			});
		});
	});

	describe('createPostSource', () => {
		it('should upsert PostSource and connect to post', async () => {
			const postId = 'p1';
			const characterName = 'Char Name';
			const sourceTitle = 'Source Title';
			const sourceType = 'ANIME' as PostSourceType;
			const mockPostSource = { id: 'ps1', sourceTitle: 'source_title', sourceType, characterName: 'char_name' };
			mockPrisma.postSource.upsert.mockResolvedValue(mockPostSource);
			mockPrisma.post.update.mockResolvedValue({});

			await createPostSource(postId, characterName, sourceTitle, sourceType);

			expect(mockPrisma.postSource.upsert).toHaveBeenCalledWith({
				where: {
					sourceTitle_sourceType_characterName: {
						sourceTitle: 'source_title',
						sourceType,
						characterName: 'char_name',
					},
				},
				create: {
					sourceTitle: 'source_title',
					sourceType,
					characterName: 'char_name',
				},
				update: {},
			});
			expect(mockPrisma.post.update).toHaveBeenCalledWith({
				where: { id: postId },
				data: {
					sources: {
						connect: { id: mockPostSource.id },
					},
				},
			});
		});
	});

	describe('createPostSources', () => {
		it('should upsert PostSources and connect to posts for existing posts', async () => {
			const results = [
				{
					postId: 'p1',
					characterName: 'Char Name',
					sourceTitle: 'Source Title',
					sourceType: 'ANIME' as PostSourceType,
				},
			];
			mockPrisma.post.findMany.mockResolvedValue([{ id: 'p1' }]);
			mockPrisma.$transaction.mockImplementation(async (fn) => {
				if (typeof fn === 'function') {
					const tx = {
						postSource: {
							upsert: vi.fn().mockResolvedValue({ id: 'ps1' }),
						},
						post: {
							update: vi.fn().mockResolvedValue({}),
						},
					};
					return fn(tx);
				}
				return 0;
			});

			const result = await createPostSources(results);

			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: { id: { in: ['p1'] } },
				select: { id: true },
			});
			expect(mockPrisma.$transaction).toHaveBeenCalled();
			expect(result).toEqual({ count: 1 });
		});

		it('should skip results for non-existent posts and not run transaction', async () => {
			const results = [
				{
					postId: 'non-existent-post-id',
					characterName: 'Char Name',
					sourceTitle: 'Source Title',
					sourceType: 'ANIME' as PostSourceType,
				},
			];
			mockPrisma.post.findMany.mockResolvedValue([]);

			const result = await createPostSources(results);

			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: { id: { in: ['non-existent-post-id'] } },
				select: { id: true },
			});
			expect(mockPrisma.$transaction).not.toHaveBeenCalled();
			expect(result).toEqual({ count: 0 });
		});
	});
});
