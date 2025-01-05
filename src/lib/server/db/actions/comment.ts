import type { TCommentSelector } from '$lib/server/types/comments';
import type { Comment } from '@prisma/client';
import prisma from '../prisma';

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
		await prisma.comment.update({
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

	await prisma.post.update({
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
			createdAt: 'desc',
		},
	});

	return comments;
}

export async function findCommentsByPostId(
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
		await prisma.comment.update({
			where: {
				id: parentCommentId,
			}, 
			data: {
				replyCount: {
					increment: 1,
				}
			}
		});
	}

	await prisma.post.update({
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
