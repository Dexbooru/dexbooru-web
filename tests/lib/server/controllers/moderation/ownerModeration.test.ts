import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

const { mockFindCollectionById, mockUpdateCollectionModerationStatus } = vi.hoisted(() => ({
	mockFindCollectionById: vi.fn(),
	mockUpdateCollectionModerationStatus: vi.fn(),
}));

vi.mock('$lib/server/db/actions/collection', () => ({
	findCollectionById: mockFindCollectionById,
	updateCollectionModerationStatus: mockUpdateCollectionModerationStatus,
}));

import {
	mockControllerHelpers,
	mockPostActions,
	mockSessionHelpers,
	mockUserActions,
} from '../../../../mocks';
import { handleGetOwnerResourceModerationStatus } from '$lib/server/controllers/moderation/getOwnerResourceModerationStatus';
import { handleOwnerAmendResourceModerationStatus } from '$lib/server/controllers/moderation/ownerAmendResourceModerationStatus';
import { handleOwnerRoleCheck } from '$lib/server/controllers/moderation/ownerRoleCheck';
import { handleUpdatePostModerationStatus } from '$lib/server/controllers/moderation/updatePostModerationStatus';

const OWNER_ID = '10000000-0000-4000-8000-000000000001';
const MODERATOR_ID = '20000000-0000-4000-8000-000000000002';
const POST_ID = '40000000-0000-4000-8000-000000000004';
const COLLECTION_ID = '50000000-0000-4000-8000-000000000005';
const TARGET_USER_ID = '60000000-0000-4000-8000-000000000006';

const baseEvent = (userId: string): RequestEvent =>
	({
		locals: { user: { id: userId } },
		url: new URL('http://localhost'),
		request: { headers: new Headers({ 'Content-Type': 'application/json' }) },
		params: {},
		getClientAddress: () => '127.0.0.1',
	}) as unknown as RequestEvent;

describe('handleOwnerRoleCheck', () => {
	beforeEach(() => {
		mockUserActions.findUserById.mockReset();
		mockControllerHelpers.createErrorResponse.mockClear();
	});

	it('returns undefined when the user is OWNER', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: OWNER_ID, role: 'OWNER' });
		const result = await handleOwnerRoleCheck(baseEvent(OWNER_ID), 'api-route');
		expect(result).toBeUndefined();
		expect(mockControllerHelpers.createErrorResponse).not.toHaveBeenCalled();
	});

	it('returns 403 when the user is a moderator', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: MODERATOR_ID, role: 'MODERATOR' });
		const result = await handleOwnerRoleCheck(baseEvent(MODERATOR_ID), 'api-route');
		expect(result).toEqual(
			expect.objectContaining({
				status: 403,
				message: 'This action is restricted to the site owner.',
			}),
		);
	});

	it('returns 404 when the user record is missing', async () => {
		mockUserActions.findUserById.mockResolvedValue(null);
		const result = await handleOwnerRoleCheck(baseEvent(OWNER_ID), 'api-route');
		expect(result).toEqual(
			expect.objectContaining({
				status: 404,
				message: 'This user does not exist.',
			}),
		);
	});
});

describe('handleGetOwnerResourceModerationStatus', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUserActions.findUserById.mockReset();
		mockPostActions.findPostById.mockReset();
		mockFindCollectionById.mockReset();
		mockControllerHelpers.validateAndHandleRequest.mockReset();
	});

	it('returns post moderation status for OWNER', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: OWNER_ID, role: 'OWNER' });
		mockPostActions.findPostById.mockResolvedValue({
			moderationStatus: 'REJECTED',
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					urlSearchParams: { resourceType: 'post', resourceId: POST_ID },
				});
			},
		);

		await handleGetOwnerResourceModerationStatus(baseEvent(OWNER_ID));

		expect(mockPostActions.findPostById).toHaveBeenCalledWith(
			POST_ID,
			{ moderationStatus: true },
			['PENDING', 'APPROVED', 'REJECTED'],
		);
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Moderation status loaded.',
			{ moderationStatus: 'REJECTED' },
		);
	});

	it('returns 404 when post is not found', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: OWNER_ID, role: 'OWNER' });
		mockPostActions.findPostById.mockResolvedValue(null);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					urlSearchParams: { resourceType: 'post', resourceId: POST_ID },
				});
			},
		);

		await handleGetOwnerResourceModerationStatus(baseEvent(OWNER_ID));

		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			404,
			'Post not found.',
		);
	});

	it('returns user moderation status for OWNER', async () => {
		mockUserActions.findUserById.mockImplementation((id: string) => {
			if (id === OWNER_ID) return Promise.resolve({ id: OWNER_ID, role: 'OWNER' });
			if (id === TARGET_USER_ID) {
				return Promise.resolve({ id: TARGET_USER_ID, moderationStatus: 'FLAGGED' });
			}
			return Promise.resolve(null);
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					urlSearchParams: { resourceType: 'user', resourceId: TARGET_USER_ID },
				});
			},
		);

		await handleGetOwnerResourceModerationStatus(baseEvent(OWNER_ID));

		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Moderation status loaded.',
			{ moderationStatus: 'FLAGGED' },
		);
	});

	it('returns collection moderation status for OWNER', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: OWNER_ID, role: 'OWNER' });
		mockFindCollectionById.mockResolvedValue({
			id: COLLECTION_ID,
			moderationStatus: 'UNFLAGGED',
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					urlSearchParams: { resourceType: 'postCollection', resourceId: COLLECTION_ID },
				});
			},
		);

		await handleGetOwnerResourceModerationStatus(baseEvent(OWNER_ID));

		expect(mockFindCollectionById).toHaveBeenCalledWith(COLLECTION_ID, {
			moderationStatus: true,
		});
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Moderation status loaded.',
			{ moderationStatus: 'UNFLAGGED' },
		);
	});

	it('returns 403 when caller is not OWNER', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: MODERATOR_ID, role: 'MODERATOR' });
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					urlSearchParams: { resourceType: 'post', resourceId: POST_ID },
				});
			},
		);

		await handleGetOwnerResourceModerationStatus(baseEvent(MODERATOR_ID));

		expect(mockPostActions.findPostById).not.toHaveBeenCalled();
		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			403,
			'This action is restricted to the site owner.',
		);
	});
});

describe('handleOwnerAmendResourceModerationStatus', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUserActions.findUserById.mockReset();
		mockPostActions.updatePost.mockReset();
		mockUserActions.updateUserModerationStatus.mockReset();
		mockUpdateCollectionModerationStatus.mockReset();
		mockSessionHelpers.invalidateCacheRemotely.mockReset();
		mockControllerHelpers.validateAndHandleRequest.mockReset();
	});

	it('updates post moderation status and invalidates pending-posts cache', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: OWNER_ID, role: 'OWNER' });
		mockPostActions.updatePost.mockResolvedValue({
			id: POST_ID,
			moderationStatus: 'PENDING',
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					body: {
						resourceType: 'post',
						resourceId: POST_ID,
						status: 'PENDING',
					},
				});
			},
		);

		await handleOwnerAmendResourceModerationStatus(baseEvent(OWNER_ID));

		expect(mockPostActions.updatePost).toHaveBeenCalledWith(POST_ID, {
			moderationStatus: 'PENDING',
		});
		expect(mockSessionHelpers.invalidateCacheRemotely).toHaveBeenCalledWith('pending-posts-0');
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Resource moderation status updated.',
			expect.objectContaining({
				resourceType: 'post',
				moderationStatus: 'PENDING',
			}),
		);
	});

	it('updates user moderation status', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: OWNER_ID, role: 'OWNER' });
		mockUserActions.updateUserModerationStatus.mockResolvedValue({
			id: TARGET_USER_ID,
			moderationStatus: 'UNFLAGGED',
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					body: {
						resourceType: 'user',
						resourceId: TARGET_USER_ID,
						status: 'UNFLAGGED',
					},
				});
			},
		);

		await handleOwnerAmendResourceModerationStatus(baseEvent(OWNER_ID));

		expect(mockUserActions.updateUserModerationStatus).toHaveBeenCalledWith(
			TARGET_USER_ID,
			'UNFLAGGED',
		);
		expect(mockSessionHelpers.invalidateCacheRemotely).not.toHaveBeenCalled();
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Resource moderation status updated.',
			expect.objectContaining({
				resourceType: 'user',
				moderationStatus: 'UNFLAGGED',
			}),
		);
	});

	it('updates collection moderation status', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: OWNER_ID, role: 'OWNER' });
		mockUpdateCollectionModerationStatus.mockResolvedValue({
			id: COLLECTION_ID,
			moderationStatus: 'FLAGGED',
		});
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					body: {
						resourceType: 'postCollection',
						resourceId: COLLECTION_ID,
						status: 'FLAGGED',
					},
				});
			},
		);

		await handleOwnerAmendResourceModerationStatus(baseEvent(OWNER_ID));

		expect(mockUpdateCollectionModerationStatus).toHaveBeenCalledWith(COLLECTION_ID, 'FLAGGED');
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Resource moderation status updated.',
			expect.objectContaining({
				resourceType: 'postCollection',
				moderationStatus: 'FLAGGED',
			}),
		);
	});

	it('does not amend when caller is not OWNER', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: MODERATOR_ID, role: 'MODERATOR' });
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					body: {
						resourceType: 'post',
						resourceId: POST_ID,
						status: 'APPROVED',
					},
				});
			},
		);

		await handleOwnerAmendResourceModerationStatus(baseEvent(MODERATOR_ID));

		expect(mockPostActions.updatePost).not.toHaveBeenCalled();
		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			403,
			'This action is restricted to the site owner.',
		);
	});
});

describe('handleUpdatePostModerationStatus (owner PENDING rule)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUserActions.findUserById.mockReset();
		mockPostActions.updatePost.mockReset();
		mockSessionHelpers.invalidateCacheRemotely.mockReset();
		mockControllerHelpers.validateAndHandleRequest.mockReset();
	});

	it('allows moderator to set APPROVED', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: MODERATOR_ID, role: 'MODERATOR' });
		mockPostActions.updatePost.mockResolvedValue({ id: POST_ID, moderationStatus: 'APPROVED' });
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					pathParams: { postId: POST_ID },
					body: { status: 'APPROVED' },
				});
			},
		);

		await handleUpdatePostModerationStatus(baseEvent(MODERATOR_ID));

		expect(mockPostActions.updatePost).toHaveBeenCalledWith(POST_ID, {
			moderationStatus: 'APPROVED',
		});
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
	});

	it('forbids moderator from setting PENDING', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: MODERATOR_ID, role: 'MODERATOR' });
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					pathParams: { postId: POST_ID },
					body: { status: 'PENDING' },
				});
			},
		);

		await handleUpdatePostModerationStatus(baseEvent(MODERATOR_ID));

		expect(mockPostActions.updatePost).not.toHaveBeenCalled();
		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			403,
			'Only the site owner can set a post back to pending moderation.',
		);
	});

	it('allows OWNER to set PENDING', async () => {
		mockUserActions.findUserById.mockResolvedValue({ id: OWNER_ID, role: 'OWNER' });
		mockPostActions.updatePost.mockResolvedValue({ id: POST_ID, moderationStatus: 'PENDING' });
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					pathParams: { postId: POST_ID },
					body: { status: 'PENDING' },
				});
			},
		);

		await handleUpdatePostModerationStatus(baseEvent(OWNER_ID));

		expect(mockPostActions.updatePost).toHaveBeenCalledWith(POST_ID, {
			moderationStatus: 'PENDING',
		});
		expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
	});

	it('returns 403 for a normal user', async () => {
		const userId = '70000000-0000-4000-8000-000000000007';
		mockUserActions.findUserById.mockResolvedValue({ id: userId, role: 'USER' });
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => {
				return await callback({
					pathParams: { postId: POST_ID },
					body: { status: 'APPROVED' },
				});
			},
		);

		await handleUpdatePostModerationStatus(baseEvent(userId));

		expect(mockPostActions.updatePost).not.toHaveBeenCalled();
		expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
			'api-route',
			403,
			'You do not have permission to update post moderation status.',
		);
	});
});
