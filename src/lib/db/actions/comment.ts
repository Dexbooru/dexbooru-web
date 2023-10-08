import type { Comment, Prisma } from '@prisma/client';
import prisma from '../prisma';
import type { DefaultArgs } from '@prisma/client/runtime/library';

type TCommentSelector = Prisma.CommentSelect<DefaultArgs>;

export const MAX_COMMENTS_PER_PAGE = 35;
export const PUBLIC_COMMENT_SELECTORS: TCommentSelector = {
	id: true,
	parentCommentId: true,
	content: true,
	createdAt: true,
	author: {
		select: {
			id: true,
			username: true,
			profilePictureUrl: true
		}
	}
};
export const PUBLIC_AUTHOR_COMMENT_SELECTIONS: TCommentSelector = {
	id: true,
	postId: true,
	authorId: true,
	content: true,
	createdAt: true,
	parentComment: {
		select: {
			content: true,
			createdAt: true,
			author: {
				select: {
					id: true,
					username: true,
					profilePictureUrl: true
				}
			}
		}
	}
};

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

export async function deleteCommentById(commentId: string): Promise<boolean> {
	if (!commentId) return false;

	const commentChildren = await prisma.comment.findUnique({
		where: {
			id: commentId
		},
		select: {
			replies: {
				select: {
					id: true
				}
			}
		}
	});
	if (!commentChildren) return false;

	const commentReplyIds = commentChildren.replies.map((commentReply) => commentReply.id);
	await Promise.all(commentReplyIds.map((commentReplyId) => deleteCommentById(commentReplyId)));

	const deletedComment = await prisma.comment.delete({
		where: {
			id: commentId
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
