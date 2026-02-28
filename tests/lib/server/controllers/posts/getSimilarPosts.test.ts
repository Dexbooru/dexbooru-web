import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGetSimilarPosts } from '$lib/server/controllers/posts/getSimilarPosts';
import { mockPostActions, mockControllerHelpers, mockMLApiHelpers } from '../../../../mocks';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TPostWithUrls = Prisma.PostGetPayload<{ select: { imageUrls: true } }>;

describe('handleGetSimilarPosts', () => {
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

	it('should return error if multiple fields provided', async () => {
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { postId: 'p1', imageUrl: 'http://url' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			400,
			expect.any(String),
		);
	});

	it('should successfully fetch similar posts by postId', async () => {
		mockPostActions.findPostById.mockResolvedValue({
			id: 'p1',
			imageUrls: ['url1'],
		} as TPostWithUrls);
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue({
			ok: true,
			json: async () => ({ results: [{ id: 'p2', score: 0.9 }] }),
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { postId: 'p1' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockPostActions.findPostById).toHaveBeenCalledWith('p1', { imageUrls: true });
		expect(mockMLApiHelpers.getSimilarPostsBySimilaritySearch).toHaveBeenCalled();
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
	});

	it('should successfully fetch similar posts by imageUrl', async () => {
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue({
			ok: true,
			json: async () => ({ results: [{ id: 'p2', score: 0.9 }] }),
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { imageUrl: 'http://url1' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockMLApiHelpers.getSimilarPostsBySimilaritySearch).toHaveBeenCalledWith(
			expect.objectContaining({ image_url: 'http://url1' }),
		);
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
	});

	it('should successfully fetch similar posts by imageFile', async () => {
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue({
			ok: true,
			json: async () => ({ results: [{ id: 'p2', score: 0.9 }] }),
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { imageFile: 'data:image/webp;base64,content' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockMLApiHelpers.getSimilarPostsBySimilaritySearch).toHaveBeenCalledWith(
			expect.objectContaining({ image_file: 'content' }),
		);
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
	});
});
