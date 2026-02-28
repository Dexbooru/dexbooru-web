import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleCreateUser } from '$lib/server/controllers/users/userLifecycle';
import { handleChangeUsername } from '$lib/server/controllers/users/userProfile';
import { handleUpdateUserRole } from '$lib/server/controllers/users/userRole';
import {
	mockUserActions,
	mockControllerHelpers,
	mockPasswordHelpers,
	mockS3Actions,
	mockImageHelpers,
	mockPreferenceActions,
	mockEmailVerificationActions,
	mockEmailHelpers,
} from '../../../../mocks';
import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Prisma } from '$generated/prisma/client';

type TUser = Prisma.UserGetPayload<Record<string, never>>;

describe('user profile and lifecycle controllers', () => {
	const mockUser = { id: 'u1', username: 'testuser', role: 'OWNER' };
	const mockEvent = {
		locals: { user: mockUser },
		cookies: { delete: vi.fn(), set: vi.fn() },
		url: new URL('http://localhost'),
	} as unknown as RequestEvent;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('handleCreateUser', () => {
		it('should successfully create user and send verification email', async () => {
			mockUserActions.findUserByNameOrEmail.mockResolvedValue(null);
			mockImageHelpers.runDefaultProfilePictureTransformationPipeline.mockResolvedValue(
				Buffer.from('pfp'),
			);
			mockS3Actions.uploadToBucket.mockResolvedValue('http://pfp-url');
			mockPasswordHelpers.hashPassword.mockResolvedValue('hashed_pass');
			mockUserActions.createUser.mockResolvedValue({
				id: 'u2',
				username: 'newuser',
				email: 'new@test.com',
			} as TUser);
			mockEmailVerificationActions.createEmailVerificationToken.mockResolvedValue({
				id: 'token-id',
			});
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						form: {
							email: 'new@test.com',
							username: 'newuser',
							password: 'pass',
							confirmedPassword: 'pass',
						},
					});
				},
			);
			vi.mocked(redirect).mockImplementation(() => {
				throw { status: 302 };
			});

			await expect(handleCreateUser(mockEvent)).rejects.toEqual({ status: 302 });

			expect(mockUserActions.createUser).toHaveBeenCalled();
			expect(mockPreferenceActions.createUserPreferences).toHaveBeenCalled();
			expect(mockEmailVerificationActions.createEmailVerificationToken).toHaveBeenCalledWith('u2');
			expect(mockEmailHelpers.sendEmail).toHaveBeenCalled();
			expect(redirect).toHaveBeenCalledWith(302, '/posts');
		});
	});

	describe('handleChangeUsername', () => {
		it('should successfully change username', async () => {
			mockUserActions.findUserByName.mockResolvedValue(null);
			mockUserActions.updateUsernameByUserId.mockResolvedValue({ id: 'u1' } as TUser);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ form: { newUsername: 'updateduser' } });
				},
			);

			await handleChangeUsername(mockEvent);

			expect(mockUserActions.updateUsernameByUserId).toHaveBeenCalledWith('u1', 'updateduser');
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});

		it('should return 409 if username exists', async () => {
			mockUserActions.findUserByName.mockResolvedValue({ id: 'u2' } as TUser);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({ form: { newUsername: 'existinguser' } });
				},
			);

			await handleChangeUsername(mockEvent);

			expect(mockControllerHelpers.createErrorResponse).toHaveBeenCalledWith(
				'form-action',
				409,
				expect.any(String),
				expect.any(Object),
			);
		});
	});

	describe('handleUpdateUserRole', () => {
		it('should allow owner to update role', async () => {
			mockUserActions.findUserById.mockResolvedValue({ username: 'owner', role: 'OWNER' } as TUser);
			mockUserActions.updateUserRoleByUsername.mockResolvedValue({
				id: 'u2',
				username: 'target',
				role: 'MODERATOR',
			} as TUser);
			mockControllerHelpers.validateAndHandleRequest.mockImplementation(
				async (event, handlerType, schema, callback) => {
					return await callback({
						pathParams: { username: 'target' },
						body: { newRole: 'MODERATOR' },
					});
				},
			);

			await handleUpdateUserRole(mockEvent);

			expect(mockUserActions.updateUserRoleByUsername).toHaveBeenCalledWith('target', 'MODERATOR');
			expect(mockControllerHelpers.createSuccessResponse).toHaveBeenCalled();
		});
	});
});
