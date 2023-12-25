import type { Comment } from '@prisma/client';

type TLevelOrderMap = Map<number, CommentTreeNode[]>;

class CommentTreeNode {
	public data: Comment | null;
	public parent: CommentTreeNode | null;
	public children: CommentTreeNode[];

	constructor(
		data: Comment | null,
		parent: CommentTreeNode | null,
		children: CommentTreeNode[] = []
	) {
		this.data = data;
		this.parent = parent;
		this.children = children;
	}
}

class CommentTree {
	public root: CommentTreeNode;

	constructor() {
		this.root = new CommentTreeNode(null, null, []);
	}

	addComment(newComment: Comment, currentCommentNode: CommentTreeNode = this.root): boolean {
		const newCommentNode = new CommentTreeNode(newComment, null, []);

		if (newComment.parentCommentId === null) {
			newCommentNode.parent = this.root;
			this.root.children.push(newCommentNode);
			return true;
		}

		if (newComment.parentCommentId === currentCommentNode?.data?.id) {
			newCommentNode.parent = currentCommentNode;
			currentCommentNode.children.push(newCommentNode);
			return true;
		}

		for (const childCommentNode of currentCommentNode.children) {
			const addedCommentNodeInSubtree = this.addComment(newComment, childCommentNode);
			if (addedCommentNodeInSubtree) return true;
		}

		return false;
	}

	private levelOrderDFSHelper(
		currentCommentNode: CommentTreeNode,
		currentLevel: number,
		levelOrderContainer: TLevelOrderMap
	) {
		if (currentCommentNode !== this.root) {
			if (!levelOrderContainer.has(currentLevel)) {
				levelOrderContainer.set(currentLevel, []);
			}

			levelOrderContainer.get(currentLevel)?.push(currentCommentNode);
		}

		for (const childCommentNode of currentCommentNode.children) {
			this.levelOrderDFSHelper(childCommentNode, currentLevel + 1, levelOrderContainer);
		}
	}

	getLevelOrder(): Comment[] {
		const levelData = new Map<number, CommentTreeNode[]>();
		this.levelOrderDFSHelper(this.root, 0, levelData);

		const orderedComments: Comment[] = [];
		for (const levelCommentNodes of levelData.values()) {
			levelCommentNodes.forEach((levelCommentNode) => {
				if (levelCommentNode && levelCommentNode.data) {
					orderedComments.push(levelCommentNode.data);
				}
			});
		}

		return orderedComments;
	}
}

export default CommentTree;
