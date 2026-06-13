import type { Tag } from '$generated/prisma/client';
import { getApplicationConfiguration } from '$lib/server/applicationConfiguration';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import prisma from '../prisma';

export async function updateTagMetadata(tagName: string, description: string | null) {
	const updatedTag = await prisma.tag.update({
		where: {
			name: tagName,
		},
		data: {
			updatedAt: new Date(),
			description,
		},
	});

	return updatedTag;
}

export async function findTagMetadata(tagName: string): Promise<Tag | null> {
	const tag = await prisma.tag.findUnique({
		where: {
			name: tagName,
		},
	});

	return tag;
}

export async function decrementTagPostCount(tags: string[]) {
	await prisma.tag.updateMany({
		where: {
			name: {
				in: tags,
			},
		},
		data: {
			postCount: {
				decrement: 1,
			},
		},
	});
}

export async function incrementTagPostCount(tags: string[]) {
	await prisma.tag.updateMany({
		where: {
			name: {
				in: tags,
			},
		},
		data: {
			postCount: {
				increment: 1,
			},
		},
	});
}

export async function findPostsByTagName(
	tagName: string,
	pageNumber: number,
	pageLimit: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector,
): Promise<TPost[]> {
	const posts = await prisma.post.findMany({
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
			[orderBy]: ascending ? 'asc' : 'desc',
		},
	});

	return posts as TPost[];
}

export async function getTagsWithStartingLetter(letter: string, pageNumber: number) {
	const { maximumTagsPerPage } = await getApplicationConfiguration();
	const tags = await prisma.tag.findMany({
		where: {
			name: {
				startsWith: letter.toLocaleLowerCase(),
			},
		},
		orderBy: { name: 'asc' },
		skip: pageNumber * maximumTagsPerPage,
		take: maximumTagsPerPage,
		select: {
			name: true,
			postCount: true,
		},
	});

	return tags;
}
