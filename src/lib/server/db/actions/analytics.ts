import type { Artist, Tag } from '$generated/prisma/client';
import prisma from '../prisma';

const findTopKPopularTags = async (k: number): Promise<Tag[]> => {
	if (k <= 0) return [];

	return (await prisma.tag.findMany({
		select: {
			name: true,
			postCount: true,
		},
		orderBy: {
			postCount: 'desc',
		},
		take: k,
	})) as Tag[];
};

const findTopKPopularArtists = async (k: number): Promise<Artist[]> => {
	if (k <= 0) return [];

	return (await prisma.artist.findMany({
		select: {
			name: true,
			postCount: true,
		},
		orderBy: {
			postCount: 'desc',
		},
		take: k,
	})) as Artist[];
};

export { findTopKPopularArtists, findTopKPopularTags };
