import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGetSimilarPosts } from '$lib/server/controllers/posts/getSimilarPosts';
import { mockPostActions, mockControllerHelpers, mockMLApiHelpers } from '../../../../mocks';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TPostWithUrls = Prisma.PostGetPayload<{ select: { imageUrls: true } }>;
type TPostEnrichment = Prisma.PostGetPayload<{
	select: {
		id: true;
		createdAt: true;
		author: { select: { username: true; profilePictureUrl: true } };
	};
}>;

const sampleMlResult = {
	post_id: 'p2',
	image_url: 'https://cdn.example/img.webp',
	similarity_score: 87.42,
};

const sampleEnrichedPost = {
	id: 'p2',
	createdAt: new Date('2024-06-01T12:00:00.000Z'),
	author: {
		username: 'alice',
		profilePictureUrl: 'https://cdn.example/alice.webp',
	},
} as TPostEnrichment;

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
		mockPostActions.findPostsByIds.mockResolvedValue([sampleEnrichedPost]);
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
			imageUrls: ['https://post/image.webp'],
		} as TPostWithUrls);
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue(
			new Response(JSON.stringify({ results: [sampleMlResult] }), { status: 200 }),
		);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { postId: 'p1' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockPostActions.findPostById).toHaveBeenCalledWith('p1', { imageUrls: true });
		expect(mockMLApiHelpers.getSimilarPostsBySimilaritySearch).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'image_url',
				imageUrl: 'https://post/image.webp',
			}),
		);
		expect(mockPostActions.findPostsByIds).toHaveBeenCalledWith(
			['p2'],
			expect.objectContaining({
				id: true,
				createdAt: true,
				author: {
					select: {
						username: true,
						profilePictureUrl: true,
					},
				},
			}),
		);
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			expect.any(String),
			expect.objectContaining({
				results: [
					{
						...sampleMlResult,
						createdAt: '2024-06-01T12:00:00.000Z',
						authorUsername: 'alice',
						authorProfilePictureUrl: 'https://cdn.example/alice.webp',
					},
				],
			}),
		);
	});

	it('should return 400 when post has no images', async () => {
		mockPostActions.findPostById.mockResolvedValue({
			id: 'p1',
			imageUrls: [],
		} as TPostWithUrls);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { postId: 'p1' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockMLApiHelpers.getSimilarPostsBySimilaritySearch).not.toHaveBeenCalled();
		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			400,
			expect.stringContaining('no images'),
		);
	});

	it('should successfully fetch similar posts by imageUrl', async () => {
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue(
			new Response(JSON.stringify({ results: [sampleMlResult] }), { status: 200 }),
		);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { imageUrl: 'http://url1' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockMLApiHelpers.getSimilarPostsBySimilaritySearch).toHaveBeenCalledWith(
			expect.objectContaining({ kind: 'image_url', imageUrl: 'http://url1' }),
		);
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
	});

	it('should successfully fetch similar posts by imageFile data URL', async () => {
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue(
			new Response(JSON.stringify({ results: [sampleMlResult] }), { status: 200 }),
		);
		const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { imageFile: dataUrl } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockMLApiHelpers.getSimilarPostsBySimilaritySearch).toHaveBeenCalledWith(
			expect.objectContaining({
				kind: 'image_file',
				filename: 'similarity-upload.png',
				contentType: 'image/png',
			}),
		);
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
	});

	it('should sort enriched results by createdAt descending', async () => {
		const older = {
			post_id: 'older',
			image_url: 'https://cdn.example/older.webp',
			similarity_score: 90,
		};
		const newer = {
			post_id: 'newer',
			image_url: 'https://cdn.example/newer.webp',
			similarity_score: 80,
		};
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue(
			new Response(JSON.stringify({ results: [older, newer] }), { status: 200 }),
		);
		mockPostActions.findPostsByIds.mockResolvedValue([
			{
				id: 'older',
				createdAt: new Date('2023-01-01T00:00:00.000Z'),
				author: { username: 'old-user', profilePictureUrl: 'https://cdn.example/old.webp' },
			},
			{
				id: 'newer',
				createdAt: new Date('2025-01-01T00:00:00.000Z'),
				author: { username: 'new-user', profilePictureUrl: 'https://cdn.example/new.webp' },
			},
		] as TPostEnrichment[]);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { imageUrl: 'http://url1' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			expect.any(String),
			{
				results: [
					expect.objectContaining({ post_id: 'newer', createdAt: '2025-01-01T00:00:00.000Z' }),
					expect.objectContaining({ post_id: 'older', createdAt: '2023-01-01T00:00:00.000Z' }),
				],
			},
		);
	});

	it('should forward ML 400 detail to client', async () => {
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue(
			new Response(JSON.stringify({ detail: 'Provide exactly one of image_url or image_file' }), {
				status: 400,
			}),
		);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { imageUrl: 'http://url1' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			400,
			'Provide exactly one of image_url or image_file',
		);
	});

	it('should map ML 500 to 502', async () => {
		mockMLApiHelpers.getSimilarPostsBySimilaritySearch.mockResolvedValue(
			new Response(JSON.stringify({ detail: 'Internal server error' }), { status: 500 }),
		);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: { imageUrl: 'http://url1' } });
			},
		);

		await handleGetSimilarPosts(mockEvent, 'api-route');

		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			502,
			'Internal server error',
		);
	});
});
