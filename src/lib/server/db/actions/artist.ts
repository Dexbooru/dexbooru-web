import type { IPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { Artist } from '@prisma/client';
import prisma from '../prisma';

export const MAX_ARTISTS_PER_AGE = 100;

export async function findPostsByArtistName(
	artistName: string,
	pageNumber: number,
	pageLimit: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector
): Promise<IPost[]> {
	const data = await prisma.artist.findUnique({
		where: {
			name: artistName
		},
		select: {
			posts: {
				select: selectors,
				skip: pageNumber * pageLimit,
				take: pageLimit,
				orderBy: {
					[orderBy]: ascending ? 'asc' : 'desc'
				}
			}
		}
	});

	if (!data) return [];

	return data.posts as IPost[];
}

export async function getArtistsWithStartingLetter(
	letter: string,
	pageNumber: number
): Promise<Artist[]> {
	const artists = await prisma.artist.findMany({
		where: {
			OR: [
				{
					name: { startsWith: letter }
				},
				{
					name: { startsWith: letter.toLocaleLowerCase() }
				}
			]
		},
		orderBy: { name: 'asc' },
		skip: pageNumber * MAX_ARTISTS_PER_AGE,
		take: MAX_ARTISTS_PER_AGE
	});

	return artists;
}
