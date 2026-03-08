import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { RequestEvent } from '@sveltejs/kit';
import { SESSION_ID_KEY } from '$lib/shared/constants/session';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { mockSessionHelpers } from '../../../mocks/helpers/sessions';
import { mockControllerHelpers } from '../../../mocks/helpers/controllers';

// Use real implementations for controllers in this test file
const {
	validateAndHandleRequest: realValidateAndHandleRequest,
	createErrorResponse: realCreateErrorResponse,
	createSuccessResponse: realCreateSuccessResponse,
} = await vi.importActual<typeof import('$lib/server/helpers/controllers')>(
	'$lib/server/helpers/controllers',
);
mockControllerHelpers.validateAndHandleRequest.mockImplementation(realValidateAndHandleRequest);
mockControllerHelpers.createErrorResponse.mockImplementation(realCreateErrorResponse);
mockControllerHelpers.createSuccessResponse.mockImplementation(realCreateSuccessResponse);

import {
	isRequestEvent,
	populateAuthenticatedUser,
	validateAndHandleRequest,
	createErrorResponse,
	createSuccessResponse,
} from '$lib/server/helpers/controllers';

function createMockEvent(overrides: Partial<{
	request: Request;
	url: URL;
	cookies: { get: (name: string) => string | undefined };
	params: Record<string, string>;
	locals: { user: typeof NULLABLE_USER };
}> = {}): RequestEvent {
	const formData = new FormData();
	const url = new URL(overrides.url ?? 'http://localhost/posts/upload');
	return {
		locals: { user: NULLABLE_USER },
		params: {},
		getClientAddress: vi.fn().mockReturnValue('127.0.0.1'),
		request: new Request(url.toString(), {
			method: 'POST',
			body: formData,
		}),
		url,
		cookies: {
			get: vi.fn().mockReturnValue(undefined),
			set: vi.fn(),
			delete: vi.fn(),
			getAll: vi.fn().mockReturnValue([]),
		},
		...overrides,
	} as unknown as RequestEvent;
}

describe('controllers', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(mockSessionHelpers.getUserClaimsFromEncodedJWTToken).mockReturnValue(null);
		// Restore real implementations (cleared by clearAllMocks)
		const actual = await vi.importActual<typeof import('$lib/server/helpers/controllers')>(
			'$lib/server/helpers/controllers',
		);
		mockControllerHelpers.validateAndHandleRequest.mockImplementation(
			actual.validateAndHandleRequest,
		);
		mockControllerHelpers.createErrorResponse.mockImplementation(actual.createErrorResponse);
		mockControllerHelpers.createSuccessResponse.mockImplementation(
			actual.createSuccessResponse,
		);
	});

	describe('isRequestEvent', () => {
		it('returns false for null', () => {
			expect(isRequestEvent(null)).toBe(false);
		});

		it('returns false for undefined', () => {
			expect(isRequestEvent(undefined)).toBe(false);
		});

		it('returns false for non-objects', () => {
			expect(isRequestEvent('string')).toBe(false);
			expect(isRequestEvent(42)).toBe(false);
		});

		it('returns false when required keys are missing', () => {
			expect(isRequestEvent({})).toBe(false);
			expect(isRequestEvent({ locals: {} })).toBe(false);
			expect(isRequestEvent({ locals: {}, params: {} })).toBe(false);
		});

		it('returns true for object with all valid keys', () => {
			const validEvent = {
				locals: {},
				params: {},
				getClientAddress: () => '',
				request: new Request('http://localhost'),
				url: new URL('http://localhost'),
			};
			expect(isRequestEvent(validEvent)).toBe(true);
		});
	});

	describe('populateAuthenticatedUser', () => {
		it('sets user to NULLABLE_USER when no session cookie', () => {
			const event = createMockEvent();
			vi.mocked(event.cookies.get).mockReturnValue(undefined);

			const result = populateAuthenticatedUser(event);

			expect(result).toBe(false);
			expect(event.locals.user).toEqual(NULLABLE_USER);
		});

		it('sets user from JWT when valid session cookie present', () => {
			const event = createMockEvent();
			const sessionUser = { id: 'u1', username: 'alice', email: 'a@b.com', emailVerified: true };
			vi.mocked(event.cookies.get).mockImplementation((name) =>
				name === SESSION_ID_KEY ? 'valid-jwt' : undefined,
			);
			vi.mocked(mockSessionHelpers.getUserClaimsFromEncodedJWTToken).mockReturnValue(
				sessionUser as never,
			);

			const result = populateAuthenticatedUser(event);

			expect(result).toBe(true);
			expect(event.locals.user).toEqual(sessionUser);
		});

		it('returns false when JWT is invalid', () => {
			const event = createMockEvent();
			vi.mocked(event.cookies.get).mockImplementation((name) =>
				name === SESSION_ID_KEY ? 'invalid-jwt' : undefined,
			);
			vi.mocked(mockSessionHelpers.getUserClaimsFromEncodedJWTToken).mockReturnValue(null);

			const result = populateAuthenticatedUser(event);

			expect(result).toBe(false);
			expect(event.locals.user).toEqual(NULLABLE_USER);
		});
	});

	describe('validateAndHandleRequest', () => {
		const formSchema = z.object({
			form: z.object({
				name: z.string().min(1),
			}),
		});

		it('returns 401 when protected and user not authenticated', async () => {
			const request = {
				method: 'POST',
				headers: new Headers({ 'Content-Type': 'multipart/form-data; boundary=test' }),
				formData: () => Promise.resolve(new FormData()),
				json: () => Promise.reject(new Error('not json')),
			} as unknown as Request;
			const event = createMockEvent({
				request,
				locals: { user: NULLABLE_USER },
			});

			const result = await validateAndHandleRequest(
				event,
				'api-route',
				formSchema,
				async () => ({ success: true }),
				true,
			);

			expect(result).toBeInstanceOf(Response);
			expect((result as Response).status).toBe(401);
		});
	});

	describe('createErrorResponse', () => {
		it('returns Response for api-route handler', () => {
			const result = createErrorResponse('api-route', 400, 'Bad request', { field: 'error' });

			expect(result).toBeInstanceOf(Response);
			expect((result as Response).status).toBe(400);
			return expect((result as Response).json()).resolves.toEqual({
				status: 400,
				message: 'Bad request',
				data: { field: 'error' },
			});
		});

		it('returns fail object for form-action handler', () => {
			const result = createErrorResponse('form-action', 422, 'Validation failed', {
				field: 'name',
			});

			expect(result).toEqual(
				expect.objectContaining({
					status: 422,
					body: expect.objectContaining({
						message: 'Validation failed',
						field: 'name',
					}),
				}),
			);
		});

		it('returns error for page-server-load handler', () => {
			const result = createErrorResponse('page-server-load', 500, 'Server error');

			expect(result).toEqual(expect.objectContaining({ status: 500, body: expect.any(Object) }));
		});
	});

	describe('createSuccessResponse', () => {
		it('returns Response for api-route handler', () => {
			const result = createSuccessResponse('api-route', 'Created', { id: '123' }, 201);

			expect(result).toBeInstanceOf(Response);
			expect((result as Response).status).toBe(201);
			return expect((result as Response).json()).resolves.toEqual({
				status: 201,
				message: 'Created',
				data: { id: '123' },
			});
		});

		it('returns success object for form-action handler', () => {
			const result = createSuccessResponse('form-action', 'Saved', { id: '456' });

			expect(result).toEqual(
				expect.objectContaining({
					success: true,
					message: 'Saved',
					id: '456',
				}),
			);
		});

		it('returns data directly for page-server-load handler', () => {
			const data = { items: [] };
			const result = createSuccessResponse('page-server-load', 'OK', data);

			expect(result).toEqual(data);
		});
	});
});
