import { MAXIMUM_ARTISTS_PER_PAGE } from '$lib/server/constants/artists';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { Artist } from '@prisma/client';
import prisma from '../prisma';

export async function updateArtistMetadata(
	artistName: string,
	description: string | null,
	socialMediaLinks: string[],
) {
	const updatedArtist = await prisma.artist.update({
		where: {
			name: artistName,
		},
		data: {
			updatedAt: new Date(),
			description,
			socialMediaLinks: {
				set: socialMediaLinks,
			},
		},
	});

	return updatedArtist;
}

export async function getArtistMetadata(artistName: string): Promise<Artist | null> {
	const artist = await prisma.artist.findUnique({
		where: {
			name: artistName,
		},
	});

	return artist;
}

export async function decrementArtistPostCount(artists: string[]) {
	await prisma.artist.updateMany({
		where: {
			name: {
				in: artists,
			},
		},
		data: {
			postCount: {
				decrement: 1,
			},
		},
	});
}

export async function incrementArtistPostCount(artists: string[]) {
	await prisma.tag.updateMany({
		where: {
			name: {
				in: artists,
			},
		},
		data: {
			postCount: {
				increment: 1,
			},
		},
	});
}

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
) {
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
		skip: pageNumber * MAXIMUM_ARTISTS_PER_PAGE,
		take: MAXIMUM_ARTISTS_PER_PAGE,
		select: {
			name: true,
		},
	});

	return artists;
}
