import type { TCommentSelector } from "../types/comments";

export const MAX_COMMENTS_PER_PAGE = 35;
export const PUBLIC_COMMENT_SELECTORS: TCommentSelector = {
	id: true,
	postId: true,
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
