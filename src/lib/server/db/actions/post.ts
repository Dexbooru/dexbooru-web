import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { Prisma } from '@prisma/client';
import prisma from '../prisma';
import redis from '../redis';

const computeIndividualPostCacheKey = (postId: string) => {
	return `post-${postId}`;
};

const computePostTotalViewsKey = (postId: string) => {
	return `post-totalviews-${postId}`;
};

export const determineCacheKey = (args: unknown, operation: string): string | null => {
	let keyName: string | null = null;
	const convertedArgs = args as Prisma.PostFindManyArgs &
		Prisma.PostFindFirstArgs &
		Prisma.PostUpdateArgs;

	if (operation === 'findUnique' || operation === 'update') {
		const postId = convertedArgs.where?.id ?? '';
		if (!convertedArgs.data.views) {
			keyName = computeIndividualPostCacheKey(postId as string);
		}
	} else if (operation === 'findMany') {
		// const skipRows = convertedArgs.skip ?? 0;
		// const takeRows = convertedArgs.take ?? 0;

		console.log(operation, args);
	}

	return keyName;
};

export async function deletePostById(postId: string, authorId: string) {
	await prisma.post.delete({
		where: {
			id: postId,
			authorId,
		},
	});
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
): Promise<TPost[]> {
	const pagePosts = await prisma.post.findMany({
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
): Promise<TPost | null> {
	try {
		const updatedPost = await prisma.post.update({
			where: {
				id: postId,
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
): Promise<TPost | null> {
	return (await prisma.post.findUnique({
		where: {
			id: postId,
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
): Promise<TPost[] | null> {
	const posts = await prisma.post.findMany({
		where: {
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

	return posts as TPost[] | null;
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
	description: string,
	isNsfw: boolean,
	tags: string[],
	artists: string[],
	imageUrls: string[],
	imageWidths: number[],
	imageHeights: number[],
	authorId: string,
): Promise<TPost> {
	const newPost = await prisma.post.create({
		data: {
			description,
			authorId,
			imageUrls,
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
			tags: {
				connectOrCreate: tags.map((tag) => {
					return {
						where: { name: tag },
						create: { name: tag },
					};
				}),
			},
		},
	});

	return newPost as TPost;
}

export const getTotalPostCount = async () => {
	return await prisma.post.count();
};

export const incrementViews = async (postId: string) => {
	await redis.incr(computePostTotalViewsKey(postId));
};

export const incrementOrDecrementLikes = async () => {};
