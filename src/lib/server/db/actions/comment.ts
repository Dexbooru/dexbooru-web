import type { TCommentSelector } from '$lib/server/types/comments';
import { MAXIMUM_COMMENTS_PER_PAGE } from '$lib/shared/constants/comments';
import type { TCommentOrderByColumn } from '$lib/shared/types/comments';
import type { Comment } from '@prisma/client';
import prisma from '../prisma';

export async function findComments(
	pageNumber: number,
	orderBy: TCommentOrderByColumn,
	ascending: boolean,
	selectors?: TCommentSelector,
) {
	const comments = await prisma.comment.findMany({
		select: selectors,
		skip: pageNumber * MAXIMUM_COMMENTS_PER_PAGE,
		take: MAXIMUM_COMMENTS_PER_PAGE,
		orderBy: {
			[orderBy]: ascending ? 'asc' : 'desc',
		},
	});

	return comments;
}

export async function findCommentById(commentId: string) {
	return await prisma.comment.findFirst({
		where: {
			id: commentId,
		},
	});
}

export async function editCommentContentById(
	commentId: string,
	updatedContent: string,
): Promise<boolean> {
	const updateCommentBatchResult = await prisma.comment.updateMany({
		where: {
			id: commentId,
		},
		data: {
			content: updatedContent,
			updatedAt: new Date(),
		},
	});

	return updateCommentBatchResult.count > 0;
}

export async function deleteCommentById(
	commentId: string,
	authorId: string,
	postId: string,
): Promise<boolean> {
	const deletedComment = await prisma.comment.delete({
		where: {
			id: commentId,
			authorId,
		},
	});

	if (deletedComment.parentCommentId) {
		prisma.comment.update({
			where: {
				id: deletedComment.parentCommentId,
			},
			data: {
				replyCount: {
					decrement: 1,
				},
			},
		});
	}

	prisma.post.update({
		where: {
			id: postId,
		},
		data: {
			commentCount: {
				decrement: 1,
			},
		},
	});

	return !!deletedComment;
}

export async function findCommentsByAuthorId(
	authorId: string,
	pageNumber: number,
	pageLimit: number,
	orderBy: TCommentOrderByColumn,
	selectors?: TCommentSelector,
): Promise<Comment[] | null> {
	const comments = await prisma.comment.findMany({
		where: {
			authorId,
		},
		select: selectors,
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			[orderBy]: 'desc',
		},
	});

	return comments;
}

export async function findCommentsByPostId(postId: string): Promise<Comment[] | null> {
	const comments = await prisma.comment.findMany({
		where: {
			postId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});

	return comments;
}

export async function findPaginatedCommentsByPostId(
	postId: string,
	parentCommentId: string | null,
	pageNumber: number,
	pageLimit: number,
	selectors?: TCommentSelector,
): Promise<Comment[] | null> {
	const comments = await prisma.comment.findMany({
		where: {
			postId,
			parentCommentId,
		},
		select: selectors,
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			createdAt: 'desc',
		},
	});

	return comments;
}

export async function createComment(
	authorId: string,
	postId: string,
	content: string,
	parentCommentId: string | null,
): Promise<Comment> {
	const newComment = await prisma.comment.create({
		data: {
			authorId,
			postId,
			content,
			parentCommentId,
		},
	});

	if (parentCommentId) {
		prisma.comment.update({
			where: {
				id: parentCommentId,
			},
			data: {
				replyCount: {
					increment: 1,
				},
			},
		});
	}

	prisma.post.update({
		where: {
			id: postId,
		},
		data: {
			commentCount: {
				increment: 1,
			},
		},
	});

	return newComment;
}
