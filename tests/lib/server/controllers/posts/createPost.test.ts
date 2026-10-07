import type { Prisma } from '$generated/prisma/client';
import type { PUBLIC_POST_SELECTORS } from '$lib/server/constants/posts';
import { readCachedSauceNaoMatches } from '$lib/server/helpers/sauceNao/search';
import { ORIGINAL_IMAGE_SUFFIX } from '$lib/shared/constants/images';
import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	mockControllerHelpers,
	mockNewPostVectorTargetPublish,
	mockPostActions,
	mockPostSourceActions,
	mockS3Actions,
	mockSQSActions,
	mockUploadStatus,
	mockUserActions,
} from '../../../../mocks';
import { handleCreatePost } from '$lib/server/controllers/posts/createPost';
import { uploadPostImages } from '$lib/server/controllers/posts/helpers';
import { mockMLApiHelpers } from '../../../../mocks/helpers/mlApi';
import { mockSessionHelpers } from '../../../../mocks/helpers/sessions';
import { NewPostVectorTargetPublisher } from '$lib/server/rabbitmq/publishers/newPostVectorTarget';

/** Stored post URL that matches `ORIGINAL_IMAGE_SUFFIX` filtering (original-sized asset). */
const ORIGINAL_TEST_IMAGE_URL = `https://cdn.example.com/key${ORIGINAL_IMAGE_SUFFIX}`;

// We still need to mock the controller helper module because it's in the same directory as the controller
// and we want to control its output
vi.mock('$lib/server/controllers/posts/helpers');
vi.mock('$lib/server/helpers/sauceNao/search', () => ({
	readCachedSauceNaoMatches: vi.fn(async () => []),
}));

type TCreatedPost = Prisma.PostGetPayload<{ select: typeof PUBLIC_POST_SELECTORS }>;
type TDuplicatePost = Prisma.PostGetPayload<{
	select: { id: true; imageUrls: true; description: true };
}>;

function buildSuccessfulCreatedPost(overrides: Partial<TCreatedPost> = {}): TCreatedPost {
	const createdAt = new Date('2026-03-28T12:00:00.000Z');
	return {
		id: 'new-p1',
		description: 'test desc',
		imageUrls: [ORIGINAL_TEST_IMAGE_URL],
		createdAt,
		author: {
			id: 'u1',
			username: 'testuser',
			profilePictureUrl: '',
		},
		...overrides,
	} as TCreatedPost;
}

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
		mockSQSActions.enqueueBatchUploadedPostImages.mockReset();
		vi.mocked(readCachedSauceNaoMatches).mockResolvedValue([]);
		mockPostSourceActions.createPostSource.mockResolvedValue({ id: 'ps1' });
	});

	it('should return 403 when user email is not verified', async () => {
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

		mockUserActions.findUserById.mockResolvedValue({
			id: 'u1',
			emailVerified: false,
		});

		const result = (await handleCreatePost(mockEvent, 'api-route')) as Response;
		expect(result.status).toBe(403);

		expect(mockUserActions.findUserById).toHaveBeenCalledWith('u1', {
			id: true,
			emailVerified: true,
		});
		expect(mockPostActions.createPost).not.toHaveBeenCalled();
		expect(mockSQSActions.enqueueBatchUploadedPostImages).not.toHaveBeenCalled();
		expect(mockNewPostVectorTargetPublish).not.toHaveBeenCalled();
		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			403,
			'You must verify your email before uploading posts',
			undefined,
		);
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

		mockUserActions.findUserById.mockResolvedValue({
			id: 'u1',
			emailVerified: true,
		});

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		const created = buildSuccessfulCreatedPost();
		mockPostActions.createPost.mockResolvedValue(created);

		const result = (await handleCreatePost(mockEvent, 'api-route')) as Response;

		expect(mockPostActions.createPost).toHaveBeenCalled();
		expect(mockSQSActions.enqueueBatchUploadedPostImages).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'new-p1', imageUrls: [ORIGINAL_TEST_IMAGE_URL] }),
		);
		expect(mockNewPostVectorTargetPublish).toHaveBeenCalledTimes(1);
		expect(mockNewPostVectorTargetPublish).toHaveBeenCalledWith(
			NewPostVectorTargetPublisher.ROUTING_KEY,
			{
				id: 'new-p1',
				description: 'test desc',
				imageUrls: [ORIGINAL_TEST_IMAGE_URL],
				createdAt: created.createdAt,
				authorId: 'u1',
			},
		);
		expect(mockMLApiHelpers.indexPostImages).not.toHaveBeenCalled();
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

		mockUserActions.findUserById.mockResolvedValue({ id: 'u1', emailVerified: true });

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
		expect(mockSQSActions.enqueueBatchUploadedPostImages).not.toHaveBeenCalled();
		expect(mockNewPostVectorTargetPublish).not.toHaveBeenCalled();
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

		mockUserActions.findUserById.mockResolvedValue({ id: 'u1', emailVerified: true });

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		const created = buildSuccessfulCreatedPost();
		mockPostActions.createPost.mockResolvedValue(created);

		vi.mocked(redirect).mockImplementation(() => {
			throw { status: 302 };
		});

		await expect(handleCreatePost(mockEvent, 'form-action')).rejects.toEqual({ status: 302 });

		expect(redirect).toHaveBeenCalledWith(302, expect.stringContaining('/posts/new-p1'));
		expect(mockSQSActions.enqueueBatchUploadedPostImages).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'new-p1' }),
		);
		expect(mockNewPostVectorTargetPublish).toHaveBeenCalledWith(
			NewPostVectorTargetPublisher.ROUTING_KEY,
			expect.objectContaining({ id: 'new-p1', authorId: 'u1' }),
		);
		expect(mockMLApiHelpers.indexPostImages).toHaveBeenCalledWith('new-p1', [
			ORIGINAL_TEST_IMAGE_URL,
		]);
		expect(mockSessionHelpers.invalidateCacheRemotely).toHaveBeenCalled();
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

		mockUserActions.findUserById.mockResolvedValue({ id: 'u1', emailVerified: true });

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
		expect(mockNewPostVectorTargetPublish).not.toHaveBeenCalled();
		expect(result.status).toBe(500);
	});

	it('should not publish to RabbitMQ when the created post has no author id', async () => {
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

		mockUserActions.findUserById.mockResolvedValue({ id: 'u1', emailVerified: true });

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		mockPostActions.createPost.mockResolvedValue(
			buildSuccessfulCreatedPost({
				author: { username: 'orphan', profilePictureUrl: '' } as TCreatedPost['author'],
			}),
		);

		const result = (await handleCreatePost(mockEvent, 'api-route')) as Response;

		expect(mockSQSActions.enqueueBatchUploadedPostImages).toHaveBeenCalled();
		expect(mockNewPostVectorTargetPublish).not.toHaveBeenCalled();
		expect(result.status).toBe(201);
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

		mockUserActions.findUserById.mockResolvedValue({ id: 'u1', emailVerified: true });

		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});

		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		mockPostActions.createPost.mockResolvedValue(buildSuccessfulCreatedPost());
		mockSQSActions.enqueueBatchUploadedPostImages.mockImplementation(() => {
			throw new Error('Queue error');
		});

		const result = (await handleCreatePost(mockEvent, 'api-route')) as Response;

		expect(mockPostActions.deletePostById).toHaveBeenCalledWith('new-p1');
		expect(mockS3Actions.deleteBatchFromBucket).toHaveBeenCalledWith(expect.any(String), ['url1']);
		expect(mockNewPostVectorTargetPublish).not.toHaveBeenCalled();
		expect(result.status).toBe(500);
	});

	const baseForm = {
		description: 'test desc',
		tags: ['tag1'],
		artists: ['artist1'],
		isNsfw: false,
		sourceLink: 'http://example.com',
		uploadId: 'upload1',
		ignoreDuplicates: false,
	};

	const imageFile = (byte: number, name: string) =>
		new File([Uint8Array.from([byte])], name, { type: 'image/png' });

	const mikuMatch = {
		indexId: 37,
		indexName: 'MangaDex',
		sourceType: 'MANGA' as const,
		similarity: 96,
		thumbnailUrl: 'https://img.saucenao.com/m.jpg',
		title: null,
		sourceUrls: [] as string[],
		artists: [] as string[],
		characters: ['Hatsune Miku'],
		series: ['Vocaloid'],
	};

	const characterOnlyMatch = {
		...mikuMatch,
		indexId: 9,
		indexName: 'Danbooru',
		characters: ['Only Character'],
		series: [] as string[],
	};

	const submitCreate = async (form: Record<string, unknown>) => {
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => callback({ form }),
		);
		mockUserActions.findUserById.mockResolvedValue({ id: 'u1', emailVerified: true });
		vi.mocked(uploadPostImages).mockResolvedValue({
			postImageUrls: ['url1'],
			postImageWidths: [100],
			postImageHeights: [100],
			postImageHashes: ['hash1'],
		});
		mockPostActions.findDuplicatePosts.mockResolvedValue([]);
		mockPostActions.createPost.mockResolvedValue(buildSuccessfulCreatedPost());
		return (await handleCreatePost(mockEvent, 'api-route')) as Response;
	};

	it('creates a post source from complete overrides and skips the classification queue', async () => {
		const result = await submitCreate({
			...baseForm,
			postPictures: [imageFile(9, 'full.png')],
			characterName: 'hatsune_miku',
			sourceTitle: 'vocaloid',
			sourceType: 'ANIME',
		});

		expect(result.status).toBe(201);
		expect(mockPostSourceActions.createPostSource).toHaveBeenCalledWith(
			'new-p1',
			'hatsune_miku',
			'vocaloid',
			'ANIME',
		);
		expect(mockSQSActions.enqueueBatchUploadedPostImages).not.toHaveBeenCalled();
		expect(readCachedSauceNaoMatches).not.toHaveBeenCalled();
		expect(mockUploadStatus.emitUploadProgress).toHaveBeenCalledWith(
			'upload1',
			'Saving post source...',
		);
		expect(mockUploadStatus.emitUploadProgress).not.toHaveBeenCalledWith(
			'upload1',
			'Enqueing post images for classification...',
		);
	});

	it('creates a post source from the first cached SauceNAO pair and skips the queue', async () => {
		vi.mocked(readCachedSauceNaoMatches).mockImplementation(async (image: Uint8Array) => {
			if (image[0] === 1) return [characterOnlyMatch];
			return [mikuMatch];
		});

		const result = await submitCreate({
			...baseForm,
			postPictures: [imageFile(1, 'first.png'), imageFile(2, 'second.png')],
		});

		expect(result.status).toBe(201);
		expect(mockPostSourceActions.createPostSource).toHaveBeenCalledWith(
			'new-p1',
			'hatsune_miku',
			'vocaloid',
			'MANGA',
		);
		expect(mockSQSActions.enqueueBatchUploadedPostImages).not.toHaveBeenCalled();
	});

	it('merges a partial override with the cached SauceNAO pair', async () => {
		vi.mocked(readCachedSauceNaoMatches).mockResolvedValue([mikuMatch]);

		const result = await submitCreate({
			...baseForm,
			postPictures: [imageFile(3, 'partial.png')],
			characterName: 'kagamine_rin',
		});

		expect(result.status).toBe(201);
		expect(mockPostSourceActions.createPostSource).toHaveBeenCalledWith(
			'new-p1',
			'kagamine_rin',
			'vocaloid',
			'MANGA',
		);
		expect(mockSQSActions.enqueueBatchUploadedPostImages).not.toHaveBeenCalled();
	});

	it('enqueues classification when no character and series can be resolved', async () => {
		vi.mocked(readCachedSauceNaoMatches).mockResolvedValue([characterOnlyMatch]);

		const result = await submitCreate({
			...baseForm,
			postPictures: [imageFile(4, 'unknown.png')],
		});

		expect(result.status).toBe(201);
		expect(mockPostSourceActions.createPostSource).not.toHaveBeenCalled();
		expect(mockSQSActions.enqueueBatchUploadedPostImages).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'new-p1', imageUrls: [ORIGINAL_TEST_IMAGE_URL] }),
		);
		expect(mockUploadStatus.emitUploadProgress).toHaveBeenCalledWith(
			'upload1',
			'Enqueing post images for classification...',
		);
	});

	it('enqueues classification when creating the post source throws', async () => {
		mockPostSourceActions.createPostSource.mockRejectedValue(new Error('db down'));

		const result = await submitCreate({
			...baseForm,
			postPictures: [imageFile(5, 'throws.png')],
			characterName: 'hatsune_miku',
			sourceTitle: 'vocaloid',
			sourceType: 'ANIME',
		});

		expect(result.status).toBe(201);
		expect(mockPostSourceActions.createPostSource).toHaveBeenCalledWith(
			'new-p1',
			'hatsune_miku',
			'vocaloid',
			'ANIME',
		);
		expect(mockSQSActions.enqueueBatchUploadedPostImages).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'new-p1', imageUrls: [ORIGINAL_TEST_IMAGE_URL] }),
		);
		expect(mockUploadStatus.emitUploadProgress).toHaveBeenCalledWith(
			'upload1',
			'Enqueing post images for classification...',
		);
	});
});
