import type { IComment } from '../types/comments';

class CommentTree {
	private data: Map<string, IComment[]>;

	constructor() {
		this.data = new Map<string, IComment[]>();
		this.data.set('root', []);
	}

	addComment(comment: IComment) {
		const parentCommentIdKey = comment.parentCommentId !== null ? comment.parentCommentId : 'root';

		if (!this.data.has(parentCommentIdKey)) {
			this.data.set(parentCommentIdKey, []);
		}

		if (!this.data.has(comment.id)) {
			this.data.set(comment.id, []);
		}

		const associatedComments = this.data.get(parentCommentIdKey) || [];
		const filteredAssociatedComments = associatedComments.filter(
			(associatedComment) => associatedComment.id !== comment.id
		);
		filteredAssociatedComments.push(comment);

		this.data.set(parentCommentIdKey, filteredAssociatedComments);
	}

	getReplies(commentId: string): IComment[] {
		if (!this.data.has(commentId)) return [];
		return this.data.get(commentId) || [];
	}

	getLevelOrder(): IComment[] {
		const ordered: IComment[] = [];
		const commentIdQueue: string[] = ['root'];

		while (commentIdQueue.length > 0) {
			const currentCommentId = commentIdQueue.shift() || 'root';
			const expandedNodes = this.data.get(currentCommentId) || [];

			for (const expandedNode of expandedNodes) {
				ordered.push(expandedNode);
				commentIdQueue.push(expandedNode.id);
			}
		}

		return ordered;
	}

	getCount(): number {
		return this.data.size - 1;
	}
}

export default CommentTree;
