import { MAX_ARTISTS_PER_PAGE } from '$lib/server/constants/artists';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { Artist, Prisma } from '@prisma/client';
import prisma from '../prisma';

export const determineCacheKey = (args: unknown, operation: string): string | null => {
	let keyName: string | null = null;
	const convertedArgs = args as Prisma.ArtistFindUniqueArgs & Prisma.ArtistFindManyArgs;

	if (operation === 'findUnique') {
		const artistName = convertedArgs.where?.name ?? '';
		const skipRows = convertedArgs.skip ?? 0;
		const takeRows = convertedArgs.take ?? 0;
		keyName = computeArtistPageCacheKey(artistName, takeRows, skipRows);
	}

	return keyName;
};

const computeArtistPageCacheKey = (artistName: string, take: number, skip: number) => {
	return `post-tags-${artistName}-${take}-${skip}`;
};

export async function findPostsByArtistName(
	artistName: string,
	pageNumber: number,
	pageLimit: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector,
): Promise<TPost[]> {
	const data = await prisma.artist.findUnique({
		where: {
			name: artistName,
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

	return (data.posts ?? []) as TPost[];
}

export async function getArtistsWithStartingLetter(
	letter: string,
	pageNumber: number,
): Promise<Artist[]> {
	const artists = await prisma.artist.findMany({
		where: {
			OR: [
				{
					name: { startsWith: letter },
				},
				{
					name: { startsWith: letter.toLocaleLowerCase() },
				},
			],
		},
		orderBy: { name: 'asc' },
		skip: pageNumber * MAX_ARTISTS_PER_PAGE,
		take: MAX_ARTISTS_PER_PAGE,
	});

	return artists;
}
