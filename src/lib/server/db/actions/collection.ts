import { MAXIMUM_COLLECTIONS_PER_PAGE } from '$lib/shared/constants/collections';
import type { Prisma } from '@prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/library';
import prisma from '../prisma';

export async function createCollection(data: Prisma.PostCollectionUncheckedCreateInput) {
	const newCollection = await prisma.postCollection.create({
		data,
	});

	return newCollection;
}

export async function findCollectionById(
	collectionId: string,
	selectors?: Prisma.PostCollectionSelect<DefaultArgs>,
) {
	return await prisma.postCollection.findFirst({
		where: {
			id: collectionId,
		},
		select: selectors,
	});
}

export async function findCollectionsByAuthorId(
	authorId: string,
	pageNumber: number,
	selectors?: Prisma.PostCollectionSelect<DefaultArgs>,
) {
	return await prisma.postCollection.findMany({
		where: {
			authorId,
		},
		skip: pageNumber * MAXIMUM_COLLECTIONS_PER_PAGE,
		take: MAXIMUM_COLLECTIONS_PER_PAGE,
		select: selectors,
	});
}

export async function findCollections(
	pageNumber: number,
	selectors?: Prisma.PostCollectionSelect<DefaultArgs>,
) {
	return await prisma.postCollection.findMany({
		skip: pageNumber * MAXIMUM_COLLECTIONS_PER_PAGE,
		take: MAXIMUM_COLLECTIONS_PER_PAGE,
		select: selectors,
		orderBy: {
			createdAt: 'desc',
		},
	});
}

export async function updateCollection(id: string, title: string, description: string) {
	const updatedCollection = await prisma.postCollection.update({
		where: { id },
		data: {
			title,
			description,
			updatedAt: new Date(),
		},
	});

	return updatedCollection;
}

export async function deleteCollection(collectionId: string, authorId: string) {
	const deletedCollection = await prisma.postCollection.delete({
		where: {
			id: collectionId,
			authorId,
		},
	});

	return deletedCollection;
}

export async function addPostToCollection(collectionId: string, postId: string) {
	const updatedCollection = await prisma.postCollection.update({
		where: { id: collectionId },
		data: {
			posts: {
				connect: { id: postId },
			},
			updatedAt: new Date(),
		},
	});

	return updatedCollection;
}

export async function removePostFromCollection(collectionId: string, postId: string) {
	const updatedCollection = await prisma.postCollection.update({
		where: { id: collectionId },
		data: {
			posts: {
				disconnect: { id: postId },
			},
			updatedAt: new Date(),
		},
	});

	return updatedCollection;
}
