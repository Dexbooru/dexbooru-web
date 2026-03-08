import type { PostSourceType } from '$generated/prisma/client';
import type { TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/server/db/actions/postSource');

import {
	createPostSource,
	createPostSources,
	findPostsByCharacterName,
	findPostsBySourceTitle,
	getPostSourcesByPostId,
} from '$lib/server/db/actions/postSource';
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

	describe('findPostsByCharacterName', () => {
		it('should call prisma.post.findMany with transformed characterName and correct args', async () => {
			const characterName = 'Char Name';
			const pageNumber = 1;
			const pageLimit = 10;
			const orderBy = 'createdAt' as TPostOrderByColumn;
			const ascending = false;
			const mockPosts = [{ id: '1', tagString: '', artistString: '' }];
			mockPrisma.post.findMany.mockResolvedValue(mockPosts);

			const result = await findPostsByCharacterName(
				characterName,
				pageNumber,
				pageLimit,
				orderBy,
				ascending,
			);

			expect(result).toEqual(mockPosts);
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: {
					moderationStatus: { in: ['PENDING', 'APPROVED'] },
					sources: {
						some: { characterName: 'char_name' },
					},
				},
				orderBy: { [orderBy]: 'desc' },
				skip: pageNumber * pageLimit,
				take: pageLimit,
				select: undefined,
			});
		});

		it('should pass selectors when provided', async () => {
			const characterName = 'goku';
			const selectors = { id: true, tagString: true } as TPostSelector;
			mockPrisma.post.findMany.mockResolvedValue([]);

			await findPostsByCharacterName(
				characterName,
				0,
				20,
				'likes',
				true,
				selectors,
			);

			expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					select: selectors,
					where: {
						moderationStatus: { in: ['PENDING', 'APPROVED'] },
						sources: { some: { characterName: 'goku' } },
					},
					orderBy: { likes: 'asc' },
				}),
			);
		});
	});

	describe('findPostsBySourceTitle', () => {
		it('should call prisma.post.findMany with transformed sourceTitle and correct args', async () => {
			const sourceTitle = 'Source Title';
			const pageNumber = 0;
			const pageLimit = 20;
			const orderBy = 'views' as TPostOrderByColumn;
			const ascending = true;
			const mockPosts = [{ id: '1', tagString: '', artistString: '' }];
			mockPrisma.post.findMany.mockResolvedValue(mockPosts);

			const result = await findPostsBySourceTitle(
				sourceTitle,
				pageNumber,
				pageLimit,
				orderBy,
				ascending,
			);

			expect(result).toEqual(mockPosts);
			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: {
					moderationStatus: { in: ['PENDING', 'APPROVED'] },
					sources: {
						some: { sourceTitle: 'source_title' },
					},
				},
				orderBy: { [orderBy]: 'asc' },
				skip: pageNumber * pageLimit,
				take: pageLimit,
				select: undefined,
			});
		});

		it('should pass selectors when provided', async () => {
			const sourceTitle = 'dragon_ball';
			const selectors = { id: true } as TPostSelector;
			mockPrisma.post.findMany.mockResolvedValue([]);

			await findPostsBySourceTitle(sourceTitle, 0, 10, 'createdAt', false, selectors);

			expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
				expect.objectContaining({
					select: selectors,
					where: {
						moderationStatus: { in: ['PENDING', 'APPROVED'] },
						sources: { some: { sourceTitle: 'dragon_ball' } },
					},
				}),
			);
		});
	});
});
