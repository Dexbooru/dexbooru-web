import { vi } from 'vitest';

type CommentModule = typeof import('$lib/server/db/actions/comment');

let actualCommentModule: CommentModule | null = null;

export const mockCommentActions = {
	findCommentById: vi.fn(),
	deleteCommentById: vi.fn(),
	editCommentContentById: vi.fn(),
};

/** Re-attach real implementations after `vi.clearAllMocks()` wipes `mockImplementation`. */
export const restoreCommentActionMocks = () => {
	if (!actualCommentModule) return;
	mockCommentActions.findCommentById.mockImplementation(actualCommentModule.findCommentById);
	mockCommentActions.deleteCommentById.mockImplementation(actualCommentModule.deleteCommentById);
	mockCommentActions.editCommentContentById.mockImplementation(
		actualCommentModule.editCommentContentById,
	);
};

vi.mock('$lib/server/db/actions/comment', async (importOriginal) => {
	actualCommentModule = await importOriginal<CommentModule>();
	restoreCommentActionMocks();
	return {
		...actualCommentModule,
		findCommentById: mockCommentActions.findCommentById,
		deleteCommentById: mockCommentActions.deleteCommentById,
		editCommentContentById: mockCommentActions.editCommentContentById,
	};
});
