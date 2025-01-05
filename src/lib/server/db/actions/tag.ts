import { MAXIMUM_TAGS_PER_PAGE } from '$lib/server/constants/tags';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { Tag } from '@prisma/client';
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

export async function getTagMetadata(tagName: string): Promise<Tag | null> {
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
	const data = await prisma.tag.findUnique({
		where: {
			name: tagName,
		},
		select: {
			posts: {
				select: selectors,
				skip: pageNumber * pageLimit,
				take: pageLimit,
				orderBy: {
					[orderBy]: ascending ? 'asc' : 'desc',
				},
			},
		},
	});

	if (!data) return [];

	return data.posts as TPost[];
}

export async function getTagsWithStartingLetter(letter: string, pageNumber: number) {
	const tags = await prisma.tag.findMany({
		where: {
			name: {
				startsWith: letter.toLocaleLowerCase(),
			},
		},
		orderBy: { name: 'asc' },
		skip: pageNumber * MAXIMUM_TAGS_PER_PAGE,
		take: MAXIMUM_TAGS_PER_PAGE,
		select: {
			name: true,
		},
	});

	return tags;
}
