import type { Artist } from '$generated/prisma/client';
import { MAXIMUM_ARTISTS_PER_PAGE } from '$lib/server/constants/artists';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
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

export async function findArtistMetadata(artistName: string): Promise<Artist | null> {
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
	await prisma.artist.updateMany({
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
	const posts = await prisma.post.findMany({
		where: {
			moderationStatus: { in: ['PENDING', 'APPROVED'] },
			artistString: {
				contains: artistName,
			},
		},
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc',
		},
		skip: pageNumber * pageLimit,
		take: pageLimit,
		select: selectors,
	});

	return posts as TPost[];
}

export async function getArtistsWithStartingLetter(letter: string, pageNumber: number) {
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
			postCount: true,
		},
	});

	return artists;
}
