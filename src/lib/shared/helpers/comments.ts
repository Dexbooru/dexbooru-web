import type { TComment } from '../types/comments';

class CommentTree {
	private data: Map<string, TComment[]>;

	constructor() {
		this.data = new Map<string, TComment[]>();
		this.data.set('root', []);
	}

	static compareComments(commentA: TComment, commentB: TComment) {
		const commentATime = commentA.createdAt.getTime();
		const commentBTime = commentB.createdAt.getTime();

		if (commentATime === commentBTime) return 0;
		if (commentATime > commentBTime) return -1;
		return 1;
	}

	addComment(comment: TComment) {
		const parentCommentIdKey = comment.parentCommentId !== null ? comment.parentCommentId : 'root';

		if (!this.data.has(parentCommentIdKey)) {
			this.data.set(parentCommentIdKey, []);
		}

		if (!this.data.has(comment.id)) {
			this.data.set(comment.id, []);
		}

		const associatedComments = this.data.get(parentCommentIdKey) || [];
		const filteredAssociatedComments = associatedComments.filter(
			(associatedComment) => associatedComment.id !== comment.id,
		);
		filteredAssociatedComments.push(comment);
		filteredAssociatedComments.sort(CommentTree.compareComments);

		this.data.set(parentCommentIdKey, filteredAssociatedComments);
	}

	getReplies(commentId: string): TComment[] {
		if (!this.data.has(commentId)) return [];
		return this.data.get(commentId) || [];
	}

	getLevelOrder(): TComment[] {
		const ordered: TComment[] = [];
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
