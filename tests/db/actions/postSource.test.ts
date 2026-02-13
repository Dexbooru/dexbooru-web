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
		it('should call prisma.postSource.findMany with correct arguments', async () => {
			const postId = 'p1';
			mockPrisma.postSource.findMany.mockResolvedValue([]);
			await getPostSourcesByPostId(postId);
			expect(mockPrisma.postSource.findMany).toHaveBeenCalledWith({
				where: { postId },
			});
		});
	});

	describe('createPostSource', () => {
		it('should call prisma.postSource.create with correct arguments', async () => {
			const postId = 'p1';
			const characterName = 'char';
			const sourceTitle = 'title';
			const sourceType = 'ANIME' as PostSourceType;
			mockPrisma.postSource.create.mockResolvedValue({});

			await createPostSource(postId, characterName, sourceTitle, sourceType);

			expect(mockPrisma.postSource.create).toHaveBeenCalledWith({
				data: {
					postId,
					characterName,
					sourceTitle,
					sourceType,
				},
			});
		});
	});

	describe('createPostSources', () => {
		it('should call prisma.postSource.createMany with transformed results', async () => {
			const results = [
				{
					postId: 'p1',
					characterName: 'Char Name',
					sourceTitle: 'Source Title',
					sourceType: 'ANIME' as PostSourceType,
				},
			];
			mockPrisma.postSource.createMany.mockResolvedValue({ count: 1 });

			await createPostSources(results);

			expect(mockPrisma.postSource.createMany).toHaveBeenCalledWith({
				data: expect.arrayContaining([
					expect.objectContaining({
						characterName: 'char_name',
					}),
				]),
				skipDuplicates: true,
			});
		});
	});
});
