import type { TCommentSelector } from '../types/comments';

export const GENERAL_COMMENTS_SELECTORS: TCommentSelector = {
	id: true,
	content: true,
	postId: true,
	createdAt: true,
	updatedAt: true,
	parentComment: {
		select: {
			id: true,
			createdAt: true,
			updatedAt: true,
			content: true,
			author: {
				select: {
					username: true,
					profilePictureUrl: true,
				},
			},
		},
	},
	author: {
		select: {
			username: true,
			profilePictureUrl: true,
		},
	},
};

export const PUBLIC_COMMENT_SELECTORS: TCommentSelector = {
	id: true,
	postId: true,
	parentCommentId: true,
	replyCount: true,
	content: true,
	createdAt: true,
	updatedAt: true,
	author: {
		select: {
			id: true,
			username: true,
			profilePictureUrl: true,
		},
	},
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
					profilePictureUrl: true,
				},
			},
		},
	},
};
