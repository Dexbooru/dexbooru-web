import type { Prisma } from '@prisma/client';
import prisma from '../prisma';

export async function createCollection(data: Prisma.PostCollectionCreateInput) {
	const newCollection = await prisma.postCollection.create({
		data,
	});

	return newCollection;
}
