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
    // Determine the immediate parent of the comment
    let currentParentId = comment.parentCommentId !== null ? comment.parentCommentId : 'root';

    while (currentParentId !== 'root') {
      if (this.data.has(currentParentId)) {
        break;
      }
      // Propagate up to the nearest parent that exists
      const parentComment = Array.from(this.data.values()).flat().find(c => c.id === currentParentId);
      currentParentId = parentComment?.parentCommentId || 'root';
    }

    // Ensure the parent exists in the map
    if (!this.data.has(currentParentId)) {
      this.data.set(currentParentId, []);
    }

    // Ensure the current comment's key exists in the map
    if (!this.data.has(comment.id)) {
      this.data.set(comment.id, []);
    }

    // Retrieve the parent's associated comments
    const associatedComments = this.data.get(currentParentId) || [];

    // Prevent duplicate comments by filtering existing ones
    const filteredAssociatedComments = associatedComments.filter(
      (associatedComment) => associatedComment.id !== comment.id
    );

    // Add the new comment and sort the parent's comments by timestamp
    filteredAssociatedComments.push(comment);
    filteredAssociatedComments.sort(CommentTree.compareComments);

    // Update the parent's comments in the map
    this.data.set(currentParentId, filteredAssociatedComments);
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
