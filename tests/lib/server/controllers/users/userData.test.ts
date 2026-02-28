import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleGetSelfData, handleGetUser } from '$lib/server/controllers/users/userData';
import { handleGetUserSettings } from '$lib/server/controllers/users/getUserSettings';
import { handleUpdateUserInterfacePreferences } from '$lib/server/controllers/users/preferences';
import {
	mockUserActions,
	mockControllerHelpers,
	mockLinkedAccountActions,
	mockOauthProvider,
	mockPreferenceActions,
	mockFriendActions,
} from '../../../../mocks';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TUser = Prisma.UserGetPayload<Record<string, never>>;

describe('user data and preferences controllers', () => {
	const mockUser = { id: 'u1', username: 'testuser', role: 'USER' };
	const mockEvent = {
		locals: { user: mockUser },
		url: new URL('http://localhost'),
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleGetSelfData', () => {
		it('should successfully fetch self data', async () => {
			mockUserActions.findUserSelf.mockResolvedValue({ id: 'u1', username: 'testuser' } as TUser);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({});
				},
			);

			await handleGetSelfData(mockEvent);

			expect(mockUserActions.findUserSelf).toHaveBeenCalledWith('u1');
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});
	});

	describe('handleGetUser', () => {
		it('should successfully fetch target user profile', async () => {
			mockUserActions.findUserByName.mockResolvedValue({ id: 'u2', username: 'target' } as TUser);
			mockFriendActions.checkIfUserIsFriended.mockResolvedValue(false);
			mockUserActions.checkIfUsersAreFriends.mockResolvedValue(true);
			mockUserActions.getUserStatistics.mockResolvedValue({ posts: 10 });
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ pathParams: { username: 'target' } });
				},
			);

			await handleGetUser(mockEvent, 'api-route');

			expect(mockUserActions.findUserByName).toHaveBeenCalledWith('target', expect.any(Object));
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalledWith(
				'api-route',
				expect.any(String),
				expect.objectContaining({ friendStatus: 'are-friends' }),
			);
		});
	});

	describe('handleGetUserSettings', () => {
		it('should successfully fetch user settings and oauth urls', async () => {
			mockLinkedAccountActions.findLinkedAccountsFromUserId.mockResolvedValue([]);
			mockOauthProvider.getAuthorizationUrl.mockResolvedValue('http://oauth-url');
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({});
				},
			);

			await handleGetUserSettings(mockEvent);

			expect(mockLinkedAccountActions.findLinkedAccountsFromUserId).toHaveBeenCalled();
			expect(mockOauthProvider.getAuthorizationUrl).toHaveBeenCalledTimes(3);
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});
	});

	describe('handleUpdateUserInterfacePreferences', () => {
		it('should successfully update UI preferences', async () => {
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ form: { customSiteWideCss: 'p { color: red; }' } });
				},
			);

			await handleUpdateUserInterfacePreferences(mockEvent);

			expect(mockPreferenceActions.updateUserPreferences).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({
					customSideWideCss: 'p { color: red; }',
				}),
			);
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});
	});
});
