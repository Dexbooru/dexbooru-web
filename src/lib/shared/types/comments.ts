import type { Comment } from '@prisma/client';

export interface ICommentCreateBody {
	postId: string;
	parentCommentId: string | null;
	content: string;
}

export interface ICommentDeleteBody {
	commentId: string;
}

export interface ICommentEditBody {
	commentId: string;
	updatedContent: string;
}

export type IComment = Comment & {
	author: {
		id: string;
		username: string;
		profilePictureUrl: string;
	};
};
