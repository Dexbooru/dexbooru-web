import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleCreatePost } from '$lib/server/controllers/posts/createPost';
import {
	mockPostActions,
	mockS3Actions,
	mockSQSActions,
	mockControllerHelpers,
} from '../../../../mocks';
import { uploadPostImages } from '$lib/server/controllers/posts/helpers';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';
import type { PUBLIC_POST_SELECTORS } from '$lib/server/constants/posts';

// We still need to mock the controller helper module because it's in the same directory as the controller
// and we want to control its output
vi.mock('$lib/server/controllers/posts/helpers');

type TCreatedPost = Prisma.PostGetPayload<{ select: typeof PUBLIC_POST_SELECTORS }>;
type TDuplicatePost = Prisma.PostGetPayload<{
	select: { id: true; imageUrls: true; description: true };
}>;

describe('handleCreatePost', () => {
	const mockUser = { id: 'u1', username: 'testuser' };
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

	it('should successfully create a post in api-route handler', async () => {
		const mockFormData = {
			description: 'test desc',
			tags: ['tag1'],
			artists: ['artist1'],
			isNsfw: false,
			postPictures: [],
			sourceLink: 'http://example.com',
			uploadId: 'upload1',
			ignoreDuplicates: false,
		};

		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: mockFormData });
			},
		);

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		mockPostActions.createPost.mockResolvedValue({
			id: 'new-p1',
			author: { username: 'testuser' },
		} as TCreatedPost);

		const result = (await handleCreatePost(mockEvent, 'api-route')) as Response;

		expect(mockPostActions.createPost).toHaveBeenCalled();
		expect(mockSQSActions.enqueueBatchUploadedPostImages).toHaveBeenCalled();
		expect(result).toBeDefined();
		expect(result.status).toBe(201);
	});

	it('should handle duplicates and return 409 error', async () => {
		const mockFormData = {
			description: 'test desc',
			tags: ['tag1'],
			artists: ['artist1'],
			isNsfw: false,
			postPictures: [],
			sourceLink: 'http://example.com',
			uploadId: 'upload1',
			ignoreDuplicates: false,
		};

		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: mockFormData });
			},
		);

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([
			{ id: 'duplicate-id' } as TDuplicatePost,
		]);

		const result = (await handleCreatePost(mockEvent, 'api-route')) as Response;

		expect(mockS3Actions.deleteBatchFromBucket).toHaveBeenCalledWith(expect.any(String), ['url1']);
		expect(mockPostActions.createPost).not.toHaveBeenCalled();
		expect(result.status).toBe(409);
	});

	it('should successfully create a post and redirect in form-action handler', async () => {
		const mockFormData = {
			description: 'test desc',
			tags: ['tag1'],
			artists: ['artist1'],
			isNsfw: false,
			postPictures: [],
			sourceLink: 'http://example.com',
			uploadId: 'upload1',
			ignoreDuplicates: false,
		};

		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: mockFormData });
			},
		);

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		mockPostActions.createPost.mockResolvedValue({
			id: 'new-p1',
			author: { username: 'testuser' },
		} as TCreatedPost);

		vi.mocked(redirect).mockImplementation(() => {
			throw { status: 302 };
		});

		await expect(handleCreatePost(mockEvent, 'form-action')).rejects.toEqual({ status: 302 });

		expect(redirect).toHaveBeenCalledWith(302, expect.stringContaining('/posts/new-p1'));
	});

	it('should rollback if an error occurs during post creation', async () => {
		const mockFormData = {
			description: 'test desc',
			tags: ['tag1'],
			artists: ['artist1'],
			isNsfw: false,
			postPictures: [],
			sourceLink: 'http://example.com',
			uploadId: 'upload1',
			ignoreDuplicates: false,
		};

		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: mockFormData });
			},
		);

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		mockPostActions.createPost.mockRejectedValue(new Error('DB error'));

		const result = (await handleCreatePost(mockEvent, 'api-route')) as Response;

		expect(mockS3Actions.deleteBatchFromBucket).toHaveBeenCalledWith(expect.any(String), ['url1']);
		expect(result.status).toBe(500);
	});

	it('should rollback post from DB and images from S3 if an error occurs after DB creation', async () => {
		const mockFormData = {
			description: 'test desc',
			tags: ['tag1'],
			artists: ['artist1'],
			isNsfw: false,
			postPictures: [],
			sourceLink: 'http://example.com',
			uploadId: 'upload1',
			ignoreDuplicates: false,
		};

		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (event, handlerType, schema, callback) => {
				return await callback({ form: mockFormData });
			},
		);

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		mockPostActions.createPost.mockResolvedValue({ id: 'new-p1' } as TCreatedPost);
		mockSQSActions.enqueueBatchUploadedPostImages.mockImplementation(() => {
			throw new Error('Queue error');
		});

		const result = (await handleCreatePost(mockEvent, 'api-route')) as Response;

		expect(mockPostActions.deletePostById).toHaveBeenCalledWith('new-p1');
		expect(mockS3Actions.deleteBatchFromBucket).toHaveBeenCalledWith(expect.any(String), ['url1']);
		expect(result.status).toBe(500);
	});
});
