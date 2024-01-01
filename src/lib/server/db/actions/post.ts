import type { IPost, TPostOrderByColumn, TPostSelector } from '$lib/shared/types/posts';
import prisma from '../prisma';

export const VALID_ORDERBY_COLUMNS: TPostOrderByColumn[] = ['createdAt', 'likes'];

export const MAX_POSTS_PER_PAGE = 25;
export const PUBLIC_POST_SELECTORS: TPostSelector = {
	id: true,
	description: true,
	createdAt: true,
	imageUrls: true,
	likes: true,
	views: true,
	author: {
		select: {
			id: true,
			username: true,
			profilePictureUrl: true
		}
	},
	tags: {
		select: {
			name: true
		}
	},
	artists: {
		select: {
			name: true
		}
	}
};

export async function deletePostById(postId: string, authorId: string): Promise<boolean> {
	if (!postId || !authorId) return false;

	const deletePostBatchResult = await prisma.post.deleteMany({
		where: {
			id: postId,
			authorId
		}
	});

	return deletePostBatchResult.count > 0;
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
			likes: action === 'like' ? { increment: 1 } : { decrement: 1 }
		}
	});

	const updatedUser = await prisma.user.update({
		where: {
			id: actionTriggerUserId
		},
		data: {
			likedPosts: {
				...(action === 'like' && {
					connect: {
						id: postId
					}
				}),
				...(action === 'dislike' && {
					disconnect: {
						id: postId
					}
				})
			}
		}
	});

	return !!updatedPost && !!updatedUser;
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
