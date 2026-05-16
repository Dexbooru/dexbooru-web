import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleDeletePostComment } from '$lib/server/controllers/comments/deletePostComment';
import {
	mockCommentActions,
	mockControllerHelpers,
	restoreCommentActionMocks,
} from '../../../../mocks';
import type { RequestEvent } from '@sveltejs/kit';

const postId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const commentId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('comment action controllers', () => {
	const baseUser = { id: 'u1', username: 'testuser', role: 'USER' as const };
	const mockEvent = {
		locals: { user: baseUser },
		url: new URL('http://localhost'),
		request: {
			headers: new Headers(),
		},
		getClientAddress: () => '127.0.0.1',
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
		restoreCommentActionMocks();
		mockCommentActions.deleteCommentById.mockReset();
		mockCommentActions.deleteCommentById.mockResolvedValue(true);
		mockCommentActions.editCommentContentById.mockReset();
		mockCommentActions.editCommentContentById.mockResolvedValue({});
		mockCommentActions.findCommentById.mockReset();
	});

	const runDeleteComment = async (
		event: RequestEvent,
		comment: { postId: string; authorId: string } | null,
	) => {
		mockCommentActions.findCommentById.mockResolvedValue(comment);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					pathParams: { postId },
					urlSearchParams: { commentId },
				});
			},
		);
		return handleDeletePostComment(event);
	};

	describe('handleDeletePostComment', () => {
		it('deletes the comment when the user is the author', async () => {
			await runDeleteComment(mockEvent, { postId, authorId: 'u1' });

			expect(mockCommentActions.deleteCommentById).toHaveBeenCalledWith(commentId, postId);
			expect(mockCommentActions.editCommentContentById).not.toHaveBeenCalled();
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});

		it('returns 403 when the user is not the author and not a moderator', async () => {
			await runDeleteComment(mockEvent, { postId, authorId: 'u2' });

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'api-route',
				403,
				expect.any(String),
			);
			expect(mockCommentActions.deleteCommentById).not.toHaveBeenCalled();
			expect(mockCommentActions.editCommentContentById).not.toHaveBeenCalled();
		});

		it('returns 403 when a regular user would have been able to act on a moderator-authored comment under the old bug', async () => {
			await runDeleteComment(mockEvent, { postId, authorId: 'moderator-user-id' });

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'api-route',
				403,
				expect.any(String),
			);
			expect(mockCommentActions.editCommentContentById).not.toHaveBeenCalled();
		});

		it('replaces content when a MODERATOR deletes another user comment', async () => {
			const modEvent = {
				...mockEvent,
				locals: { user: { id: 'm1', username: 'mod', role: 'MODERATOR' as const } },
			} as unknown as RequestEvent;

			await runDeleteComment(modEvent, { postId, authorId: 'u2' });

			expect(mockCommentActions.editCommentContentById).toHaveBeenCalledWith(
				commentId,
				'This comment has been removed by a site moderator',
			);
			expect(mockCommentActions.deleteCommentById).not.toHaveBeenCalled();
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});

		it('replaces content when an OWNER deletes another user comment', async () => {
			const ownerEvent = {
				...mockEvent,
				locals: { user: { id: 'o1', username: 'owner', role: 'OWNER' as const } },
			} as unknown as RequestEvent;

			await runDeleteComment(ownerEvent, { postId, authorId: 'u2' });

			expect(mockCommentActions.editCommentContentById).toHaveBeenCalledWith(
				commentId,
				'This comment has been removed by a site moderator',
			);
			expect(mockCommentActions.deleteCommentById).not.toHaveBeenCalled();
		});

		it('hard-deletes when a moderator deletes their own comment', async () => {
			const modEvent = {
				...mockEvent,
				locals: { user: { id: 'm1', username: 'mod', role: 'MODERATOR' as const } },
			} as unknown as RequestEvent;

			await runDeleteComment(modEvent, { postId, authorId: 'm1' });

			expect(mockCommentActions.deleteCommentById).toHaveBeenCalledWith(commentId, postId);
			expect(mockCommentActions.editCommentContentById).not.toHaveBeenCalled();
		});
	});
});
