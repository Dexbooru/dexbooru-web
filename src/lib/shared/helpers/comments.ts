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
		let currentParentId = comment.parentCommentId !== null ? comment.parentCommentId : 'root';

		while (currentParentId !== 'root') {
			if (this.data.has(currentParentId)) {
				break;
			}
			const parentComment = Array.from(this.data.values())
				.flat()
				.find((c) => c.id === currentParentId);
			currentParentId = parentComment?.parentCommentId || 'root';
		}

		if (!this.data.has(currentParentId)) {
			this.data.set(currentParentId, []);
		}

		if (!this.data.has(comment.id)) {
			this.data.set(comment.id, []);
		}

		const associatedComments = this.data.get(currentParentId) || [];

		const filteredAssociatedComments = associatedComments.filter(
			(associatedComment) => associatedComment.id !== comment.id,
		);

		filteredAssociatedComments.push(comment);
		filteredAssociatedComments.sort(CommentTree.compareComments);

		this.data.set(currentParentId, filteredAssociatedComments);
	}

	editComment(commentId: string, newContent: string) {
		for (const comments of this.data.values()) {
			const comment = comments.find((c) => c.id === commentId);
			if (comment) {
				comment.content = newContent;
				return true;
			}
		}
		return false;
	}

	deleteComment(commentId: string) {
		const queue: string[] = [commentId];
		while (queue.length > 0) {
			const currentId = queue.shift()!;
			if (this.data.has(currentId)) {
				queue.push(...this.data.get(currentId)!.map((c) => c.id));
				this.data.delete(currentId);
			}
		}

		for (const [parentId, comments] of this.data.entries()) {
			this.data.set(
				parentId,
				comments.filter((c) => c.id !== commentId),
			);
		}

		return true;
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
