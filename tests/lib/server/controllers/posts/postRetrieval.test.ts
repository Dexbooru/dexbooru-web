import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGetPost } from '$lib/server/controllers/posts/getPost';
import { handleGetPosts } from '$lib/server/controllers/posts/getPosts';
import { handleGetPostsByAuthor } from '$lib/server/controllers/posts/getPostsByAuthor';
import { handleGetPostsWithArtistName } from '$lib/server/controllers/posts/getPostsWithArtistName';
import { handleGetPostsWithTagName } from '$lib/server/controllers/posts/getPostsWithTagName';
import {
	mockPostActions,
	mockControllerHelpers,
	mockSessionHelpers,
	mockUserActions,
	mockArtistActions,
	mockTagActions,
} from '../../../../mocks';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TPostBase = Prisma.PostGetPayload<{
	select: { id: true; tagString: true; artistString: true };
}>;

describe('post retrieval controllers', () => {
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

	describe('handleGetPost', () => {
		it('should return cached post if available', async () => {
			const mockPost = { id: 'p1', tagString: 't1', artistString: 'a1' } as TPostBase;
			mockSessionHelpers.getRemoteResponseFromCache.mockResolvedValue(mockPost);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { postId: 'p1' }, urlSearchParams: {} });
				},
			);

			await handleGetPost(mockEvent, 'api-route');

			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
				'api-route',
				expect.any(String),
				mockPost,
			);
		});

		it('should fetch from DB and cache if not in cache', async () => {
			const mockPost = { id: 'p1', tagString: 't1', artistString: 'a1' } as TPostBase;
			mockSessionHelpers.getRemoteResponseFromCache.mockResolvedValue(null);
			mockPostActions.findPostById.mockResolvedValue(mockPost);
			mockPostActions.findSimilarPosts.mockResolvedValue({ posts: [], similarities: {} });
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { postId: 'p1' }, urlSearchParams: {} });
				},
			);

			await handleGetPost(mockEvent, 'api-route');

			expect(mockPostActions.findPostById).toHaveBeenCalledWith('p1', expect.any(Object));
			expect(mockSessionHelpers.cacheResponseRemotely).toHaveBeenCalled();
		});
	});

	describe('handleGetPosts', () => {
		it('should successfully fetch general posts', async () => {
			const mockPosts = [{ id: 'p1', tagString: 't1', artistString: 'a1' } as TPostBase];
			mockSessionHelpers.getRemoteResponseFromCache.mockResolvedValue(null);
			mockPostActions.findPostsByPage.mockResolvedValue(mockPosts);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						urlSearchParams: {
							category: 'general',
							pageNumber: 0,
							orderBy: 'createdAt',
							ascending: false,
						},
					});
				},
			);

			await handleGetPosts(mockEvent, 'api-route');

			expect(mockPostActions.findPostsByPage).toHaveBeenCalled();
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});

		it('should successfully fetch liked posts for authenticated user', async () => {
			const mockPosts = [{ id: 'p1', tagString: 't1', artistString: 'a1' } as TPostBase];
			mockSessionHelpers.getRemoteResponseFromCache.mockResolvedValue(null);
			mockUserActions.findLikedPostsByAuthorId.mockResolvedValue(mockPosts);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						urlSearchParams: {
							category: 'liked',
							pageNumber: 0,
							orderBy: 'createdAt',
							ascending: false,
						},
					});
				},
			);

			await handleGetPosts(mockEvent, 'api-route');

			expect(mockUserActions.findLikedPostsByAuthorId).toHaveBeenCalledWith(
				0,
				expect.any(Number),
				'u1',
				'createdAt',
				false,
				expect.any(Object),
			);
		});
	});

	describe('handleGetPostsByAuthor', () => {
		it('should fetch posts by author username', async () => {
			const mockPosts = [{ id: 'p1', tagString: 't1', artistString: 'a1' } as TPostBase];
			mockSessionHelpers.getRemoteResponseFromCache.mockResolvedValue(null);
			mockPostActions.findPostsByAuthorId.mockResolvedValue(mockPosts);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						pathParams: { username: 'user1' },
						urlSearchParams: { pageNumber: 0, orderBy: 'createdAt', ascending: false },
					});
				},
			);

			await handleGetPostsByAuthor(mockEvent, 'api-route');

			expect(mockPostActions.findPostsByAuthorId).toHaveBeenCalledWith(
				0,
				expect.any(Number),
				'user1',
				'createdAt',
				false,
				expect.any(Object),
			);
		});
	});

	describe('handleGetPostsWithArtistName', () => {
		it('should fetch posts by artist name', async () => {
			const mockPosts = [{ id: 'p1', tagString: 't1', artistString: 'a1' } as TPostBase];
			mockSessionHelpers.getRemoteResponseFromCache.mockResolvedValue(null);
			mockArtistActions.findPostsByArtistName.mockResolvedValue(mockPosts);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						pathParams: { name: 'artist1' },
						urlSearchParams: { pageNumber: 0, orderBy: 'createdAt', ascending: false },
					});
				},
			);

			await handleGetPostsWithArtistName(mockEvent, 'api-route');

			expect(mockArtistActions.findPostsByArtistName).toHaveBeenCalledWith(
				'artist1',
				0,
				expect.any(Number),
				'createdAt',
				false,
				expect.any(Object),
			);
		});
	});

	describe('handleGetPostsWithTagName', () => {
		it('should fetch posts by tag name', async () => {
			const mockPosts = [{ id: 'p1', tagString: 't1', artistString: 'a1' } as TPostBase];
			mockSessionHelpers.getRemoteResponseFromCache.mockResolvedValue(null);
			mockTagActions.findPostsByTagName.mockResolvedValue(mockPosts);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						pathParams: { name: 'tag1' },
						urlSearchParams: { pageNumber: 0, orderBy: 'createdAt', ascending: false },
					});
				},
			);

			await handleGetPostsWithTagName(mockEvent, 'api-route');

			expect(mockTagActions.findPostsByTagName).toHaveBeenCalledWith(
				'tag1',
				0,
				expect.any(Number),
				'createdAt',
				false,
				expect.any(Object),
			);
		});
	});
});
