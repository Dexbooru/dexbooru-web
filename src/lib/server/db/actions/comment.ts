import type { Comment } from '@prisma/client';
import prisma from '../prisma';
import type { TCommentSelector } from '$lib/server/types/comments';

export async function editCommentContentById(
	commentId: string,
	authorId: string,
	updatedContent: string
): Promise<boolean> {
	if (!commentId || !updatedContent) return false;

	const updateCommentBatchResult = await prisma.comment.updateMany({
		where: {
			OR: [{ id: commentId }, { authorId }]
		},
		data: {
			content: updatedContent
		}
	});

	return updateCommentBatchResult.count > 0;
}

export async function deleteCommentById(commentId: string, authorId: string): Promise<boolean> {
	if (!commentId) return false;

	const deletedComment = await prisma.comment.delete({
		where: {
			id: commentId,
			authorId
		}
	});

	return !!deletedComment;
}

export async function findCommentsByAuthorId(
	authorId: string,
	pageNumber: number,
	pageLimit: number,
	selectors?: TCommentSelector
): Promise<Comment[] | null> {
	const comments = await prisma.comment.findMany({
		where: {
			authorId
		},
		select: selectors,
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			createdAt: 'desc'
		}
	});

	return comments;
}

export async function findCommentsByPostId(
	postId: string,
	parentCommentId: string | null,
	pageNumber: number,
	pageLimit: number,
	selectors?: TCommentSelector
): Promise<Comment[] | null> {
	const comments = await prisma.comment.findMany({
		where: {
			postId,
			parentCommentId
		},
		select: selectors,
		skip: pageNumber * pageLimit,
		take: pageLimit,
		orderBy: {
			createdAt: 'desc'
		}
	});

	return comments;
}

export async function createComment(
	authorId: string,
	postId: string,
	content: string,
	parentCommentId: string | null
): Promise<Comment> {
	const newComment = await prisma.comment.create({
		data: {
			authorId,
			postId,
			content,
			parentCommentId
		}
	});

	return newComment;
}
