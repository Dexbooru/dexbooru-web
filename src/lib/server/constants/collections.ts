import type { Prisma } from '@prisma/client';
import type { DefaultArgs } from '@prisma/client/runtime/library';

export const PUBLIC_POST_COLLECTION_SELECTORS: Prisma.PostCollectionSelect<DefaultArgs> = {
	id: true,
	title: true,
	description: true,
	thumbnailImageUrls: true,
	authorId: true,
	isNsfw: true,
	createdAt: true,
	updatedAt: true,
	author: {
		select: {
			id: true,
			username: true,
			profilePictureUrl: true,
		},
	},
	posts: {
		select: {
			id: true,
		},
	},
};
