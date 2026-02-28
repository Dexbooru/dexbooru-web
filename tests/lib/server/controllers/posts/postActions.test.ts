import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleDeletePost } from '$lib/server/controllers/posts/deletePost';
import { handleLikePost } from '$lib/server/controllers/posts/likePost';
import { handleUpdatePost } from '$lib/server/controllers/posts/updatePost';
import { handleCheckForDuplicatePosts } from '$lib/server/controllers/posts/checkDuplicatePosts';
import { mockPostActions, mockControllerHelpers, mockS3Actions } from '../../../../mocks';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TPostWithAuthor = Prisma.PostGetPayload<{
	select: { id: true; imageUrls: true; author: { select: { id: true; role: true } } };
}>;
type TPostBase = Prisma.PostGetPayload<{
	select: {
		id: true;
		authorId: true;
		description: true;
		imageUrls: true;
		imageHeights: true;
		imageWidths: true;
	};
}>;
type TDuplicatePost = Prisma.PostGetPayload<{ select: { id: true } }>;

describe('post action controllers', () => {
	const mockUser = { id: 'u1', username: 'testuser', role: 'USER' };
	const mockEvent = {
		locals: { user: mockUser },
		url: new URL('http://localhost'),
		request: {
			headers: new Headers(),
		},
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleDeletePost', () => {
		it('should successfully delete post if user is author', async () => {
			const mockPost = {
				id: 'p1',
				imageUrls: ['url1'],
				author: { id: 'u1', role: 'USER' },
			} as TPostWithAuthor;
			mockPostActions.findPostById.mockResolvedValue(mockPost);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { postId: 'p1' } });
				},
			);

			await handleDeletePost(mockEvent);

			expect(mockPostActions.deletePostById).toHaveBeenCalledWith('p1');
			expect(mockS3Actions.deleteBatchFromBucket).toHaveBeenCalled();
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});

		it('should return 403 if user is not author', async () => {
			const mockPost = { id: 'p1', author: { id: 'u2', role: 'USER' } } as TPostWithAuthor;
			mockPostActions.findPostById.mockResolvedValue(mockPost);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { postId: 'p1' } });
				},
			);

			await handleDeletePost(mockEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'api-route',
				403,
				expect.any(String),
			);
		});
	});

	describe('handleLikePost', () => {
		it('should successfully like a post', async () => {
			mockPostActions.findPostById.mockResolvedValue({ id: 'p1' } as TPostBase);
			mockPostActions.likePostById.mockResolvedValue(true);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { postId: 'p1' }, body: { action: 'like' } });
				},
			);

			await handleLikePost(mockEvent);

			expect(mockPostActions.likePostById).toHaveBeenCalledWith('p1', 'like', 'u1');
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});
	});

	describe('handleUpdatePost', () => {
		it('should successfully update post description', async () => {
			const mockPost = {
				id: 'p1',
				authorId: 'u1',
				description: 'old',
				imageUrls: [],
				imageHeights: [],
				imageWidths: [],
			} as unknown as TPostBase;
			mockPostActions.findPostById.mockResolvedValue(mockPost);
			mockPostActions.updatePost.mockResolvedValue({
				...mockPost,
				description: 'new',
			} as TPostBase);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						pathParams: { postId: 'p1' },
						body: { description: 'new' },
					});
				},
			);

			await handleUpdatePost(mockEvent);

			expect(mockPostActions.updatePost).toHaveBeenCalledWith(
				'p1',
				expect.objectContaining({ description: 'new' }),
			);
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});
	});

	describe('handleCheckForDuplicatePosts', () => {
		it('should return duplicates if found', async () => {
			const mockDuplicates = [{ id: 'p2' } as TDuplicatePost];
			mockPostActions.findDuplicatePosts.mockResolvedValue(mockDuplicates);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ body: { hashes: ['hash1'] } });
				},
			);

			await handleCheckForDuplicatePosts(mockEvent, 'api-route');

			expect(mockPostActions.findDuplicatePosts).toHaveBeenCalled();
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
				'api-route',
				expect.any(String),
				{ duplicatePosts: mockDuplicates },
			);
		});
	});
});
