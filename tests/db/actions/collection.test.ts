import type { CollectionModerationStatus } from '$generated/prisma/enums';
import type { PostCollectionUncheckedCreateInput } from '$generated/prisma/models';
import {
	addPostToCollection,
	createCollection,
	deleteCollectionById,
	findCollectionById,
	findCollectionsByAuthorId,
	removePostFromCollection,
	updateCollection,
	updateCollectionModerationStatus,
} from '$lib/server/db/actions/collection';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockPrisma } from '../../mocks/prisma';

describe('collection actions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createCollection', () => {
		it('should call prisma.postCollection.create with correct arguments', async () => {
			const data = { title: 'test', authorId: 'user1' };
			const mockCollection = { id: 'coll1', ...data };
			mockPrisma.postCollection.create.mockResolvedValue(mockCollection);

			const result = await createCollection(data as PostCollectionUncheckedCreateInput);

			expect(result).toEqual(mockCollection);
			expect(mockPrisma.postCollection.create).toHaveBeenCalledWith({
				data,
				select: expect.any(Object),
			});
		});
	});

	describe('findCollectionById', () => {
		it('should call prisma.postCollection.findFirst with correct arguments', async () => {
			const collectionId = 'coll1';
			const mockCollection = { id: collectionId };
			mockPrisma.postCollection.findFirst.mockResolvedValue(mockCollection);

			const result = await findCollectionById(collectionId);

			expect(result).toEqual(mockCollection);
			expect(mockPrisma.postCollection.findFirst).toHaveBeenCalledWith({
				relationLoadStrategy: 'join',
				where: { id: collectionId },
				select: undefined,
			});
		});
	});

	describe('findCollectionsByAuthorId', () => {
		it('should call prisma.postCollection.findMany with correct arguments', async () => {
			const authorId = 'user1';
			const pageNumber = 1;
			const ascending = true;
			const orderBy = 'createdAt';
			const mockCollections = [{ id: 'coll1' }];
			mockPrisma.postCollection.findMany.mockResolvedValue(mockCollections);

			const result = await findCollectionsByAuthorId(authorId, pageNumber, ascending, orderBy);

			expect(result).toEqual(mockCollections);
			expect(mockPrisma.postCollection.findMany).toHaveBeenCalledWith({
				where: { authorId },
				skip: pageNumber * 28,
				take: 28,
				select: undefined,
				orderBy: { [orderBy]: 'asc' },
			});
		});
	});

	describe('updateCollection', () => {
		it('should call prisma.postCollection.update with correct arguments', async () => {
			const id = 'coll1';
			const title = 'new title';
			const description = 'new desc';
			const mockCollection = { id, title, description };
			mockPrisma.postCollection.update.mockResolvedValue(mockCollection);

			const result = await updateCollection(id, title, description);

			expect(result).toEqual(mockCollection);
			expect(mockPrisma.postCollection.update).toHaveBeenCalledWith({
				where: { id },
				data: {
					title,
					description,
					updatedAt: expect.any(Date),
				},
			});
		});
	});

	describe('deleteCollectionById', () => {
		it('should call prisma.postCollection.delete with correct arguments', async () => {
			const collectionId = 'coll1';
			const authorId = 'user1';
			mockPrisma.postCollection.delete.mockResolvedValue({ id: collectionId });

			const result = await deleteCollectionById(collectionId, authorId);

			expect(result).toEqual({ id: collectionId });
			expect(mockPrisma.postCollection.delete).toHaveBeenCalledWith({
				where: { id: collectionId, authorId },
			});
		});
	});

	describe('addPostToCollection', () => {
		it('should call prisma.postCollection.update with connect', async () => {
			const collectionId = 'coll1';
			const postId = 'post1';
			mockPrisma.postCollection.update.mockResolvedValue({ id: collectionId });

			await addPostToCollection(collectionId, postId);

			expect(mockPrisma.postCollection.update).toHaveBeenCalledWith({
				where: { id: collectionId },
				data: {
					posts: { connect: { id: postId } },
					updatedAt: expect.any(Date),
				},
			});
		});
	});

	describe('removePostFromCollection', () => {
		it('should call prisma.postCollection.update with disconnect', async () => {
			const collectionId = 'coll1';
			const postId = 'post1';
			mockPrisma.postCollection.update.mockResolvedValue({ id: collectionId });

			await removePostFromCollection(collectionId, postId);

			expect(mockPrisma.postCollection.update).toHaveBeenCalledWith({
				where: { id: collectionId },
				data: {
					posts: { disconnect: { id: postId } },
					updatedAt: expect.any(Date),
				},
			});
		});
	});

	describe('updateCollectionModerationStatus', () => {
		it('should call prisma.postCollection.update with correct arguments', async () => {
			const collectionId = 'coll1';
			const status = 'APPROVED' as CollectionModerationStatus;
			mockPrisma.postCollection.update.mockResolvedValue({
				id: collectionId,
				moderationStatus: status,
			});

			await updateCollectionModerationStatus(collectionId, status);

			expect(mockPrisma.postCollection.update).toHaveBeenCalledWith({
				where: { id: collectionId },
				data: {
					moderationStatus: status,
					updatedAt: expect.any(Date),
				},
			});
		});
	});
});
