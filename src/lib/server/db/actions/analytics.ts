import type { Artist, Tag } from '$generated/prisma/client';
import type { TPost } from '$lib/shared/types/posts';
import prisma from '../prisma';

const findTopKMostViewedPosts = async (k: number, lookbackHours: number) => {
	if (k <= 0) return [];

	const lookbackMs = lookbackHours * 60 * 60 * 1000;
	return (await prisma.post.findMany({
		select: {
			id: true,
			description: true,
			views: true,
		},
		where: {
			createdAt: {
				gte: new Date(Date.now() - lookbackMs),
			},
		},
		orderBy: {
			views: 'desc',
		},
		take: k,
	})) as TPost[];
};

const findTopKMostLikedPosts = async (k: number, lookbackHours: number) => {
	if (k <= 0) return [];

	const lookbackMs = lookbackHours * 60 * 60 * 1000;

	return (await prisma.post.findMany({
		select: {
			id: true,
			description: true,
			likes: true,
			author: {
				select: {
					username: true,
					profilePictureUrl: true,
				},
			},
		},
		where: {
			createdAt: {
				gte: new Date(Date.now() - lookbackMs),
			},
		},
		orderBy: {
			likes: 'desc',
		},
		take: k,
	})) as TPost[];
};

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

export {
	findTopKMostLikedPosts,
	findTopKMostViewedPosts,
	findTopKPopularArtists,
	findTopKPopularTags,
};
