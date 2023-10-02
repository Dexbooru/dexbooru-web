export interface ICommentCreateBody {
	authorId: string;
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
