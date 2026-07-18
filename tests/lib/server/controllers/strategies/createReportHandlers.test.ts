import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import type { TReportStrategy } from '$lib/server/controllers/strategies/types';

const {
	mockValidateAndHandleRequest,
	mockCreateSuccessResponse,
	mockCreateErrorResponse,
	mockHandleModerationRoleCheck,
} = vi.hoisted(() => ({
	mockValidateAndHandleRequest: vi.fn(),
	mockCreateSuccessResponse: vi.fn(),
	mockCreateErrorResponse: vi.fn(),
	mockHandleModerationRoleCheck: vi.fn(),
}));

vi.mock('$lib/server/helpers/controllers', () => ({
	validateAndHandleRequest: mockValidateAndHandleRequest,
	createSuccessResponse: mockCreateSuccessResponse,
	createErrorResponse: mockCreateErrorResponse,
}));

vi.mock('$lib/server/controllers/reports', () => ({
	handleModerationRoleCheck: mockHandleModerationRoleCheck,
}));

import { createReportHandlers } from '$lib/server/controllers/strategies/createReportHandlers';

describe('createReportHandlers', () => {
	const mockEvent = {
		locals: { user: { id: 'u1' } },
		url: new URL('http://localhost'),
		request: { headers: new Headers() },
	} as unknown as RequestEvent;

	const create = vi.fn();
	const findByTargetId = vi.fn();
	const findPaginated = vi.fn();
	const deleteByIds = vi.fn();
	const updateStatus = vi.fn();
	const onStatusUpdated = vi.fn();

	const strategy: TReportStrategy<{ id: string }, 'SPAM'> = {
		entityLabel: 'post',
		responseCollectionKey: 'postReports',
		responseCreatedKey: 'newPostReport',
		schemas: {
			create: {},
			getByTarget: {},
			getGeneral: {},
			delete: {},
			updateStatus: {},
		},
		resolveCreateTarget: async () => ({ id: 'target-1' }),
		resolveGetTarget: async () => ({ id: 'target-1' }),
		resolveDeleteTarget: async () => ({ id: 'target-1' }),
		missingTargetMessage: () => 'missing',
		create,
		findByTargetId,
		findPaginated,
		deleteByIds,
		updateStatus,
		onStatusUpdated,
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockHandleModerationRoleCheck.mockResolvedValue(null);
		mockCreateSuccessResponse.mockImplementation((_h, _m, data, status) => ({ data, status }));
		mockCreateErrorResponse.mockImplementation((_h, status, message) => ({ status, message }));
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) => callback({}),
		);
	});

	it('creates a report through the strategy', async () => {
		create.mockResolvedValue({ id: 'r1' });
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) =>
				callback({
					pathParams: { postId: 'target-1' },
					body: { description: 'bad', category: 'SPAM' },
				}),
		);

		const { handleCreate } = createReportHandlers(strategy);
		await handleCreate(mockEvent);

		expect(create).toHaveBeenCalledWith({
			description: 'bad',
			category: 'SPAM',
			targetId: 'target-1',
		});
		expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Successfully created the post report.',
			{ newPostReport: { id: 'r1' } },
			201,
		);
	});

	it('runs moderation checks and pagination for general listing', async () => {
		findPaginated.mockResolvedValue([{ id: 'r1' }]);
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) =>
				callback({
					urlSearchParams: {
						pageNumber: 0,
						reviewStatus: 'NOT_REVIEWED',
						category: undefined,
					},
				}),
		);

		const { handleGetGeneral } = createReportHandlers(strategy);
		await handleGetGeneral(mockEvent);

		expect(mockHandleModerationRoleCheck).toHaveBeenCalled();
		expect(findPaginated).toHaveBeenCalledWith(0, 'NOT_REVIEWED', undefined);
		expect(mockCreateSuccessResponse).toHaveBeenCalledWith(
			'api-route',
			'Successfully fetched the post reports.',
			{ postReports: [{ id: 'r1' }] },
		);
	});

	it('invokes onStatusUpdated after a status update', async () => {
		updateStatus.mockResolvedValue({ id: 'r1' });
		mockValidateAndHandleRequest.mockImplementation(
			async (_event, _handlerType, _schema, callback) =>
				callback({
					pathParams: { reportId: 'r1' },
					body: { reviewStatus: 'ACCEPTED' },
				}),
		);

		const { handleUpdateStatus } = createReportHandlers(strategy);
		await handleUpdateStatus(mockEvent);

		expect(updateStatus).toHaveBeenCalledWith('r1', 'ACCEPTED');
		expect(onStatusUpdated).toHaveBeenCalledWith('r1', 'ACCEPTED', { id: 'r1' });
	});
});
