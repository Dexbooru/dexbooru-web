import type { TComment } from '../types/comments';
import { normalizeQuery } from './search';

class CommentTree {
	private data: Map<string, TComment[]>;
	private commentsById: Map<string, TComment>;

	constructor() {
		this.data = new Map<string, TComment[]>();
		this.data.set('root', []);
		this.commentsById = new Map<string, TComment>();
	}

	static compareComments(commentA: TComment, commentB: TComment) {
		const commentATime = commentA.createdAt.getTime();
		const commentBTime = commentB.createdAt.getTime();

		if (commentATime === commentBTime) return 0;
		if (commentATime > commentBTime) return -1;
		return 1;
	}

	search(query: string): TComment[] {
		const normalizedQuery = normalizeQuery(query);
		const allComments = Array.from(this.commentsById.values());
		return allComments.filter((comment) =>
			normalizeQuery(comment.content).includes(normalizedQuery),
		);
	}

	hasComment(commentId: string): boolean {
		return this.commentsById.has(commentId);
	}

	addComments(comments: TComment[]) {
		comments.forEach((comment) => this.addComment(comment));
	}

	addComment(comment: TComment) {
		const currentParentId = comment.parentCommentId !== null ? comment.parentCommentId : 'root';
		this.commentsById.set(comment.id, comment);
		if (!this.data.has(currentParentId)) this.data.set(currentParentId, []);
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

	editComment(commentId: string, newContent: string, updatedAt: Date) {
		const comment = this.commentsById.get(commentId);
		if (!comment) return false;
		comment.content = newContent;
		comment.updatedAt = updatedAt;
		return true;
	}

	deleteComment(commentId: string) {
		const queue: string[] = [commentId];
		const removedCommentIds = new Set<string>();
		while (queue.length > 0) {
			const currentId = queue.shift()!;
			removedCommentIds.add(currentId);
			if (this.data.has(currentId)) {
				queue.push(...this.data.get(currentId)!.map((c) => c.id));
				this.data.delete(currentId);
			}
			this.commentsById.delete(currentId);
		}

		for (const [parentId, comments] of this.data.entries()) {
			this.data.set(
				parentId,
				comments.filter((c) => !removedCommentIds.has(c.id)),
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
		return this.commentsById.size;
	}
}

export default CommentTree;
