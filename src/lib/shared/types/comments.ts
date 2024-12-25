import type { Comment } from '@prisma/client';

export type TCommentCreateBody = {
	parentCommentId: string | null;
	content: string;
};

export type TCommentDeleteBody = {
	commentId: string;
};

export type TCommentEditBody = {
	commentId: string;
	updatedContent: string;
};

export type TComment = Comment & {
	replyCount: number;
	author: {
		id: string;
		username: string;
		profilePictureUrl: string;
	};
};
