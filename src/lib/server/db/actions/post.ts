import type { IPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import prisma from '../prisma';

export async function deletePostById(postId: string, authorId: string): Promise<IPost | null> {
	if (!postId) return null;

	const deletedPost = await prisma.post.delete({
		where: {
			id: postId,
			authorId
		},
		select: {
			imageUrls: true
		}
	});

	return deletedPost as IPost;
}

export async function findPostsByPage(
	pageNumber: number,
	pageLimit: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector
): Promise<IPost[]> {
	const pagePosts = await prisma.post.findMany({
		select: selectors,
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc'
		}
	});

	return pagePosts as IPost[];
}

export async function findPostById(
	postId: string,
	selectors?: TPostSelector
): Promise<IPost | null> {
	return (await prisma.post.findUnique({
		where: {
			id: postId
		},
		select: selectors
	})) as IPost | null;
}

export async function findPostsByAuthorId(
	pageNumber: number,
	pageLimit: number,
	authorId: string,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector
): Promise<IPost[] | null> {
	const posts = await prisma.post.findMany({
		where: {
			authorId
		},
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc'
		},
		select: selectors
	});

	return posts as IPost[] | null;
}

export async function likePostById(
	postId: string,
	action: string,
	actionTriggerUserId: string
): Promise<boolean> {
	if (!postId || !['like', 'dislike'].includes(action)) return false;

	const updatedPost = await prisma.post.update({
		where: {
			id: postId
		},
		data: {
			likes: action === 'like' ? { increment: 1 } : { decrement: 1 },
			likedBy: {
				...(action === 'like' && {
					connect: {
						id: actionTriggerUserId
					}
				}),
				...(action === 'dislike' && {
					disconnect: {
						id: actionTriggerUserId
					}
				})
			}
		}
	});

	return !!updatedPost;
}

export async function createPost(
	description: string,
	tags: string[],
	artists: string[],
	imageUrls: string[],
	authorId: string
): Promise<IPost> {
	const newPost = await prisma.post.create({
		data: {
			description,
			authorId,
			imageUrls,
			artists: {
				connectOrCreate: artists.map((artist) => {
					return {
						where: { name: artist },
						create: { name: artist }
					};
				})
			},
			tags: {
				connectOrCreate: tags.map((tag) => {
					return {
						where: { name: tag },
						create: { name: tag }
					};
				})
			}
		}
	});

	return newPost as IPost;
}
