import { MAX_TAGS_PER_PAGE } from '$lib/server/constants/tags';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { Prisma, Tag } from '@prisma/client';
import prisma from '../prisma';

export const determineCacheKey = (args: unknown, operation: string): string | null => {
	let keyName: string | null = null;
	const convertedArgs = args as Prisma.TagFindUniqueArgs & Prisma.TagFindManyArgs;

	if (operation === 'findUnique') {
		const tagName = convertedArgs.where?.name ?? '';
		const skipRows = convertedArgs.skip ?? 0;
		const takeRows = convertedArgs.take ?? 0;
		keyName = computeTagPageCacheKey(tagName, takeRows, skipRows);
	}

	return keyName;
};

const computeTagPageCacheKey = (tagName: string, take: number, skip: number) => {
	return `post-tags-${tagName}-${take}-${skip}`;
};

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

export async function getTagsWithStartingLetter(
	letter: string,
	pageNumber: number,
): Promise<Tag[]> {
	const tags = await prisma.tag.findMany({
		where: {
			name: {
				startsWith: letter.toLocaleLowerCase(),
			},
		},
		orderBy: { name: 'asc' },
		skip: pageNumber * MAX_TAGS_PER_PAGE,
		take: MAX_TAGS_PER_PAGE,
	});

	return tags;
}
