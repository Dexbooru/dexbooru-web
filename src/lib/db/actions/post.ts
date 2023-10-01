import type { Post, Prisma } from '@prisma/client';
import prisma from '../prisma';
import type { DefaultArgs } from '@prisma/client/runtime/library';

type TPostSelector = Prisma.PostSelect<DefaultArgs>;
type TPostOrderByColumn = 'likes' | 'createdAt';

export const PUBLIC_POST_SELECTORS: TPostSelector = {
	id: true,
	description: true,
	createdAt: true,
	images: true,
	likes: true,
	author: {
		select: {
			id: true,
			username: true
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

export async function deletePostById(postId: string, authorId: string) {
	if (!postId || !authorId) return;

	await prisma.post.delete({
		where: {
			id: postId,
			authorId
		}
	});
}

export async function findPostsByPage(
	pageNumber: number,
	pageLimit: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
	selectors?: TPostSelector
): Promise<Post[]> {
	const pagePosts = await prisma.post.findMany({
		select: selectors,
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc'
		}
	});

	return pagePosts;
}

export async function findPostById(
	postId: string,
	selectors?: TPostSelector
): Promise<Post | null> {
	return prisma.post.findUnique({
		where: {
			id: postId
		},
		select: selectors
	});
}

export async function createPost(
	description: string,
	tags: string[],
	artists: string[],
	authorId: string
): Promise<Post> {
	const newPost = await prisma.post.create({
		data: {
			description,
			authorId,
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

	return newPost;
}
