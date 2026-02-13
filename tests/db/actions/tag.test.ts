import {
	decrementTagPostCount,
	findPostsByTagName,
	findTagMetadata,
	getTagsWithStartingLetter,
	incrementTagPostCount,
	updateTagMetadata,
} from '$lib/server/db/actions/tag';
import type { TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';

describe('tag actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('updateTagMetadata', () => {
		it('should call prisma.tag.update with correct arguments', async () => {
			const tagName = 'tag1';
			const description = 'desc';
			mockPrisma.tag.update.mockResolvedValue({});
			await updateTagMetadata(tagName, description);
			expect(mockPrisma.tag.update).toHaveBeenCalledWith({
				where: { name: tagName },
				data: {
					updatedAt: expect.any(Date),
					description,
				},
			});
		});
	});

	describe('findTagMetadata', () => {
		it('should call prisma.tag.findUnique with correct arguments', async () => {
			const tagName = 'tag1';
			const mockTag = { name: tagName, description: 'desc' };
			mockPrisma.tag.findUnique.mockResolvedValue(mockTag);

			const result = await findTagMetadata(tagName);

			expect(result).toEqual(mockTag);
			expect(mockPrisma.tag.findUnique).toHaveBeenCalledWith({
				where: { name: tagName },
			});
		});
	});

	describe('decrementTagPostCount', () => {
		it('should call prisma.tag.updateMany with correct arguments', async () => {
			const tags = ['t1', 't2'];
			await decrementTagPostCount(tags);
			expect(mockPrisma.tag.updateMany).toHaveBeenCalledWith({
				where: { name: { in: tags } },
				data: { postCount: { decrement: 1 } },
			});
		});
	});

	describe('incrementTagPostCount', () => {
		it('should call prisma.tag.updateMany with correct arguments', async () => {
			const tags = ['t1', 't2'];
			await incrementTagPostCount(tags);
			expect(mockPrisma.tag.updateMany).toHaveBeenCalledWith({
				where: { name: { in: tags } },
				data: { postCount: { increment: 1 } },
			});
		});
	});

	describe('findPostsByTagName', () => {
		it('should call prisma.post.findMany with correct arguments', async () => {
			const tagName = 'tag1';
			const pageNumber = 1;
			const pageLimit = 20;
			const orderBy = 'createdAt';
			const ascending = false;
			const selectors = { id: true, tagString: true } as TPostSelector;

			mockPrisma.post.findMany.mockResolvedValue([]);

			await findPostsByTagName(tagName, pageNumber, pageLimit, orderBy, ascending, selectors);

			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: {
					moderationStatus: { in: ['PENDING', 'APPROVED'] },
					tagString: {
						contains: tagName,
					},
				},
				select: selectors,
				skip: pageNumber * pageLimit,
				take: pageLimit,
				orderBy: {
					[orderBy]: 'desc',
				},
			});
		});

		it('should call prisma.post.findMany with ascending order when ascending is true', async () => {
			const tagName = 'tag1';
			const pageNumber = 0;
			const pageLimit = 10;
			const orderBy = 'id' as TPostOrderByColumn;
			const ascending = true;

			mockPrisma.post.findMany.mockResolvedValue([]);

			await findPostsByTagName(tagName, pageNumber, pageLimit, orderBy, ascending);

			expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
				where: {
					moderationStatus: { in: ['PENDING', 'APPROVED'] },
					tagString: {
						contains: tagName,
					},
				},
				select: undefined,
				skip: 0,
				take: 10,
				orderBy: {
					[orderBy]: 'asc',
				},
			});
		});
	});

	describe('getTagsWithStartingLetter', () => {
		it('should call prisma.tag.findMany with correct arguments', async () => {
			const letter = 'A';
			mockPrisma.tag.findMany.mockResolvedValue([]);
			await getTagsWithStartingLetter(letter, 0);
			expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
				where: { name: { startsWith: 'a' } },
				orderBy: { name: 'asc' },
				skip: 0,
				take: 100,
				select: { name: true, postCount: true },
			});
		});
	});
});
