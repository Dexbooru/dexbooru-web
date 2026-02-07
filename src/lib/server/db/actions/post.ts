import type { PostModerationStatus, Prisma } from '$generated/prisma/client';
import { PUBLIC_POST_SELECTORS } from '$lib/server/constants/posts';
import { MAXIMUM_SIMILAR_POSTS_PER_POST } from '$lib/shared/constants/posts';
import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import prisma from '../prisma';
import { decrementArtistPostCount, incrementArtistPostCount } from './artist';
import { decrementTagPostCount, incrementTagPostCount } from './tag';

export async function hasUserLikedPost(userId: string, postId: string) {
	const post = await prisma.post.findFirst({
		where: {
			id: postId,
			likedBy: {
				some: {
					id: userId,
				},
			},
		},
	});
	return !!post;
}

export async function deletePostById(postId: string): Promise<TPost> {
	const deletedPost = await prisma.post.delete({
		where: {
			id: postId,
		},
		select: {
			tags: {
				select: {
					name: true,
				},
			},
			artists: {
				select: {
					name: true,
				},
			},
		},
	});

	await decrementTagPostCount(deletedPost.tags.map((tag) => tag.name));
	await decrementArtistPostCount(deletedPost.artists.map((artist) => artist.name));

	return deletedPost as TPost;
}

export async function updatePost(postId: string, newData: Prisma.PostUpdateInput) {
	const updatedPost = await prisma.post.update({
		where: {
			id: postId,
		},
		data: {
			...newData,
			updatedAt: new Date(),
		},
	});
	return updatedPost;
}

export async function findPostsByPage(
	pageNumber: number,
	pageLimit: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector,
	moderationStatus?: PostModerationStatus[],
): Promise<TPost[]> {
	const pagePosts = await prisma.post.findMany({
		where: {
			moderationStatus: moderationStatus
				? { in: moderationStatus }
				: { in: ['PENDING', 'APPROVED'] },
		},
		select: selectors,
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc',
		},
	});

	return pagePosts as TPost[];
}

export async function findPostByIdWithUpdatedViewCount(
	postId: string,
	selectors?: TPostSelector,
	moderationStatus?: PostModerationStatus[],
): Promise<TPost | null> {
	try {
		const updatedPost = await prisma.post.update({
			relationLoadStrategy: 'join',
			where: {
				id: postId,
				moderationStatus: moderationStatus
					? { in: moderationStatus }
					: { in: ['PENDING', 'APPROVED'] },
			},
			data: {
				views: {
					increment: 1,
				},
			},
			select: selectors,
		});
		return updatedPost as TPost;
	} catch (error) {
		return null;
	}
}

export async function findPostById(
	postId: string,
	selectors?: TPostSelector,
	moderationStatus?: PostModerationStatus[],
): Promise<TPost | null> {
	return (await prisma.post.findUnique({
		relationLoadStrategy: 'join',
		where: {
			id: postId,
			moderationStatus: moderationStatus
				? { in: moderationStatus }
				: { in: ['PENDING', 'APPROVED'] },
		},
		select: selectors,
	})) as TPost | null;
}

export async function findPostsByAuthorId(
	pageNumber: number,
	pageLimit: number,
	authorId: string,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector,
	moderationStatus?: PostModerationStatus[],
): Promise<TPost[]> {
	const posts = await prisma.post.findMany({
		where: {
			moderationStatus: moderationStatus
				? { in: moderationStatus }
				: { in: ['PENDING', 'APPROVED'] },
			OR: [
				{
					authorId,
				},
				{
					author: {
						username: authorId,
					},
				},
			],
		},
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc',
		},
		select: selectors,
	});

	if (!posts) return [];

	return posts as TPost[];
}

export async function likePostById(
	postId: string,
	action: 'like' | 'dislike',
	userId: string,
): Promise<boolean> {
	const updatedPost = await prisma.post.update({
		where: {
			id: postId,
		},
		data: {
			updatedAt: new Date(),
			likes: action === 'like' ? { increment: 1 } : { decrement: 1 },
			likedBy: {
				...(action === 'like' && {
					connect: {
						id: userId,
					},
				}),
				...(action === 'dislike' && {
					disconnect: {
						id: userId,
					},
				}),
			},
		},
	});

	return !!updatedPost;
}

export async function createPost(
	sourceLink: string,
	description: string,
	isNsfw: boolean,
	tags: string[],
	artists: string[],
	imageUrls: string[],
	imageWidths: number[],
	imageHeights: number[],
	imageHashes: string[],
	authorId: string,
) {
	const newPost = await prisma.post.create({
		data: {
			sourceLink,
			description,
			authorId,
			imageUrls,
			imageHashes,
			imageHeights,
			imageWidths,
			isNsfw,
			artists: {
				connectOrCreate: artists.map((artist) => {
					return {
						where: { name: artist },
						create: { name: artist },
					};
				}),
			},
			artistString: artists.toSorted().join(','),
			tags: {
				connectOrCreate: tags.map((tag) => {
					return {
						where: { name: tag },
						create: { name: tag },
					};
				}),
			},
			tagString: tags.toSorted().join(','),
		},
		select: PUBLIC_POST_SELECTORS,
	});

	incrementTagPostCount(tags);
	incrementArtistPostCount(artists);

	return newPost;
}

export async function findTotalPostCount() {
	return await prisma.post.count();
}

export async function findDuplicatePosts(
	hashes: string[],
	limit: number,
	selectors?: TPostSelector,
) {
	return await prisma.post.findMany({
		where: {
			imageHashes: {
				hasSome: hashes,
			},
		},
		select: selectors,
		take: limit,
	});
}

export async function findSimilarPosts(
	postId: string,
	tagString: string,
	artistString: string,
	selectors?: TPostSelector,
) {
	if (tagString.length === 0 && artistString.length === 0) {
		return {
			posts: [] as TPost[],
			similarities: {} as Record<string, number>,
		};
	}

	const tags = tagString.split(',');
	const artists = artistString.split(',');

	const orStatements: Prisma.PostWhereInput['OR'] = [];
	tags.forEach((tag) => {
		orStatements.push({
			tagString: {
				contains: tag,
			},
		});
	});
	artists.forEach((artist) => {
		orStatements.push({
			artistString: {
				contains: artist,
			},
		});
	});

	const similarPosts = (await prisma.post.findMany({
		where: {
			moderationStatus: { in: ['PENDING', 'APPROVED'] },
			id: {
				not: {
					equals: postId,
				},
			},
			OR: orStatements,
		},
		select: selectors,
		take: MAXIMUM_SIMILAR_POSTS_PER_POST,
	})) as TPost[];

	const originalSet = new Set([...tags, ...artists]);

	const similarityMap: Record<string, number> = {};
	similarPosts.forEach((similarPost) => {
		const similarTags = similarPost.tagString.split(',');
		const similarArtists = similarPost.artistString.split(',');

		const similarSet = new Set([...similarTags, ...similarArtists]);
		const intersection = new Set([...originalSet].filter((item) => similarSet.has(item)));

		const union = new Set([...originalSet, ...similarSet]);
		const jaccardSimilarity = union.size === 0 ? 0 : (intersection.size / union.size) * 100;
		similarityMap[similarPost.id] = jaccardSimilarity;
	});

	const filteredSimilarPosts = similarPosts.filter((post) => similarityMap[post.id] > 40);
	return {
		posts: filteredSimilarPosts,
		similarities: similarityMap,
	};
}
