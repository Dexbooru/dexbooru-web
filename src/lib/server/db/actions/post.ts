import type { TPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import type { Prisma } from '@prisma/client';
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

export async function deletePostById(postId: string, authorId: string): Promise<TPost> {
	const deletedPost = await prisma.post.delete({
		where: {
			id: postId,
			authorId,
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

	decrementTagPostCount(deletedPost.tags.map((tag) => tag.name));
	decrementArtistPostCount(deletedPost.artists.map((artist) => artist.name));

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
	sourceLink: string,
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
			sourceLink,
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

	incrementTagPostCount(tags);
	incrementArtistPostCount(artists);

	return newPost as TPost;
}

export const getTotalPostCount = async () => {
	return await prisma.post.count();
};
