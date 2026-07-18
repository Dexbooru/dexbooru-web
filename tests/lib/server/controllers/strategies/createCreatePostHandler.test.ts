import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import type { TCreatePostStrategy } from '$lib/server/controllers/strategies/types';

const {
	mockValidateAndHandleRequest,
	mockCreateSuccessResponse,
	mockCreateErrorResponse,
	mockEmitUploadProgress,
	mockEmitUploadFailure,
} = vi.hoisted(() => ({
	mockValidateAndHandleRequest: vi.fn(),
	mockCreateSuccessResponse: vi.fn((...args: unknown[]) => args),
	mockCreateErrorResponse: vi.fn((handlerType: string, status: number) => ({
		status,
		handlerType,
	})),
	mockEmitUploadProgress: vi.fn(),
	mockEmitUploadFailure: vi.fn(),
}));

vi.mock('$lib/server/helpers/controllers', () => ({
	validateAndHandleRequest: mockValidateAndHandleRequest,
	createSuccessResponse: mockCreateSuccessResponse,
	createErrorResponse: mockCreateErrorResponse,
}));

vi.mock('$lib/server/events/uploadStatus', () => ({
	emitUploadProgress: mockEmitUploadProgress,
	emitUploadFailure: mockEmitUploadFailure,
}));

vi.mock('$lib/server/logging/logger', () => ({
	default: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

import { createCreatePostHandler } from '$lib/server/controllers/strategies/createCreatePostHandler';

describe('createCreatePostHandler', () => {
	const mockEvent = {
		locals: { user: { id: 'u1', username: 'tester' } },
		url: new URL('http://localhost'),
		request: { headers: new Headers() },
	} as unknown as RequestEvent;

	const uploadImages = vi.fn();
	const findDuplicates = vi.fn();
	const createPost = vi.fn();
	const afterCreate = vi.fn();
	const onFormActionSuccess = vi.fn();
	const ensureAuthorCanUpload = vi.fn();
	const deleteUploadedImages = vi.fn();
	const deletePost = vi.fn();

	const strategy: TCreatePostStrategy = {
		schema: {},
		maxDuplicatesToSearch: 5,
		requireEmailVerified: true,
		messages: {
			emailUnverified: 'verify email',
			duplicatesDetected: 'duplicates',
			success: 'ok',
			unexpectedError: 'unexpected',
			pipelineFailureFallback: 'pipeline failed',
		},
		ensureAuthorCanUpload,
		uploadImages,
		findDuplicates,
		deleteUploadedImages,
		createPost,
		deletePost,
		afterCreate,
		onFormActionSuccess,
		getFormRedirectPath: (postId) => `/posts/${postId}`,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		ensureAuthorCanUpload.mockResolvedValue({ ok: true });
		uploadImages.mockResolvedValue({
			postImageUrls: ['https://cdn.example/a_original'],
			postImageWidths: [100],
			postImageHeights: [80],
			postImageHashes: ['hash'],
		});
		findDuplicates.mockResolvedValue([]);
		createPost.mockResolvedValue({
			id: 'p1',
			description: 'desc',
			imageUrls: ['https://cdn.example/a_original'],
			createdAt: new Date('2026-01-01T00:00:00.000Z'),
			author: { id: 'u1', username: 'tester', profilePictureUrl: '' },
		});
	});

	it('returns 403 when the author cannot upload', async () => {
		ensureAuthorCanUpload.mockResolvedValue({ ok: false, reason: 'verify email' });
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, handlerType, _schema, callback) =>
				callback({
					form: {
						description: 'd',
						tags: [],
						artists: [],
						isNsfw: false,
						postPictures: [],
						sourceLink: '',
						ignoreDuplicates: false,
					},
				}),
		);

		const handle = createCreatePostHandler(strategy);
		const result = (await handle(mockEvent, 'api-route')) as { status: number };

		expect(result.status).toBe(403);
		expect(uploadImages).not.toHaveBeenCalled();
		expect(createPost).not.toHaveBeenCalled();
	});

	it('creates a post and runs afterCreate for api-route success', async () => {
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, handlerType, _schema, callback) =>
				callback({
					form: {
						description: 'd',
						tags: ['t'],
						artists: ['a'],
						isNsfw: false,
						postPictures: [],
						sourceLink: 'https://example.com',
						uploadId: 'upload-1',
						ignoreDuplicates: false,
					},
				}),
		);

		const handle = createCreatePostHandler(strategy);
		await handle(mockEvent, 'api-route');

		expect(uploadImages).toHaveBeenCalled();
		expect(createPost).toHaveBeenCalled();
		expect(afterCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				uploadId: 'upload-1',
				originalImageUrls: ['https://cdn.example/a_original'],
			}),
		);
		expect(onFormActionSuccess).not.toHaveBeenCalled();
		expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'ok',
			expect.objectContaining({ newPost: expect.objectContaining({ id: 'p1' }) }),
			201,
		);
	});

	it('returns 409 and cleans up images when duplicates are found', async () => {
		findDuplicates.mockResolvedValue([
			{ id: 'dup-1', imageUrls: ['x'], description: 'dup' },
		]);
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, handlerType, _schema, callback) =>
				callback({
					form: {
						description: 'd',
						tags: [],
						artists: [],
						isNsfw: false,
						postPictures: [],
						sourceLink: '',
						ignoreDuplicates: false,
					},
				}),
		);

		const handle = createCreatePostHandler(strategy);
		const result = (await handle(mockEvent, 'api-route')) as { status: number };

		expect(result.status).toBe(409);
		expect(deleteUploadedImages).toHaveBeenCalledWith(['https://cdn.example/a_original']);
		expect(createPost).not.toHaveBeenCalled();
	});
});
