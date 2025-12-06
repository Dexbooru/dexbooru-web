import type { Prisma } from '$generated/prisma/client';
import { PUBLIC_POST_COLLECTION_SELECTORS } from '$lib/server/constants/collections';
import { MAXIMUM_COLLECTIONS_PER_PAGE } from '$lib/shared/constants/collections';
import type { TCollectionOrderByColumn, TPostCollection } from '$lib/shared/types/collections';
import type { DefaultArgs } from '@prisma/client/runtime/client';
import prisma from '../prisma';

export async function createCollection(data: Prisma.PostCollectionUncheckedCreateInput) {
	const newCollection = await prisma.postCollection.create({
		data,
		select: PUBLIC_POST_COLLECTION_SELECTORS,
	});

	return newCollection;
}

export async function findCollectionById(
	collectionId: string,
	selectors?: Prisma.PostCollectionSelect<DefaultArgs>,
) {
	return (await prisma.postCollection.findFirst({
		relationLoadStrategy: 'join',
		where: {
			id: collectionId,
		},
		select: selectors,
	})) as TPostCollection;
}

export async function findCollectionsByAuthorId(
	authorId: string,
	pageNumber: number,
	ascending: boolean,
	orderBy: TCollectionOrderByColumn,
	selectors?: Prisma.PostCollectionSelect<DefaultArgs>,
) {
	return (await prisma.postCollection.findMany({
		where: {
			authorId,
		},
		skip: pageNumber * MAXIMUM_COLLECTIONS_PER_PAGE,
		take: MAXIMUM_COLLECTIONS_PER_PAGE,
		select: selectors,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc',
		},
	})) as TPostCollection[];
}

export async function findCollectionsFromIds(
	collectionIds: string[],
	selectors?: Prisma.PostCollectionSelect<DefaultArgs>,
) {
	return (await prisma.postCollection.findMany({
		where: {
			id: {
				in: collectionIds,
			},
		},
		select: selectors,
	})) as TPostCollection[];
}

export async function findCollectionsForPost(
	postId: string,
	pageNumber: number,
	ascending: boolean,
	orderBy: TCollectionOrderByColumn,
	selectors?: Prisma.PostCollectionSelect<DefaultArgs>,
) {
	return (await prisma.postCollection.findMany({
		where: {
			posts: {
				some: {
					id: postId,
				},
			},
		},
		skip: pageNumber * MAXIMUM_COLLECTIONS_PER_PAGE,
		take: MAXIMUM_COLLECTIONS_PER_PAGE,
		select: selectors,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc',
		},
	})) as TPostCollection[];
}

export async function findCollections(
	pageNumber: number,
	ascending: boolean,
	orderBy: TCollectionOrderByColumn,
	selectors?: Prisma.PostCollectionSelect<DefaultArgs>,
) {
	return (await prisma.postCollection.findMany({
		skip: pageNumber * MAXIMUM_COLLECTIONS_PER_PAGE,
		take: MAXIMUM_COLLECTIONS_PER_PAGE,
		select: selectors,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc',
		},
	})) as TPostCollection[];
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

export async function deleteCollectionById(collectionId: string, authorId: string) {
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
