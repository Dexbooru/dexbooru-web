import { UUID_REGEX } from '$lib/shared/constants/search';
import type { TUser } from '$lib/shared/types/users';
import { findUserById, updateUserRoleById, updateUserRoleByUsername } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { UserRoleUpdateSchema } from '../request-schemas/users';
import type { RequestEvent } from '@sveltejs/kit';

export const handleUpdateUserRole = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UserRoleUpdateSchema,
		async (data) => {
			const targetUsername = data.pathParams.username;
			const { newRole } = data.body;

			try {
				const user = await findUserById(event.locals.user.id, { username: true, role: true });
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						`A user with the id: ${event.locals.user.id} does not exist`,
					);
				}

				if (user.role !== 'OWNER') {
					return createErrorResponse(
						'api-route',
						403,
						'Only imageboard owners are authorized to promote/demote user roles',
					);
				}

				if (user.username === targetUsername && newRole !== 'OWNER') {
					return createErrorResponse(
						'api-route',
						403,
						'Imageboard owners cannot demote themselves to a lower role',
					);
				}

				const updateDbFn = UUID_REGEX.test(targetUsername)
					? updateUserRoleById
					: updateUserRoleByUsername;
				const updatedUser = await updateDbFn(targetUsername, newRole);
				if (!updatedUser) {
					return createErrorResponse(
						'api-route',
						404,
						`A user with the name: ${targetUsername} does not exist`,
					);
				}

				if (newRole === 'OWNER') {
					await updateUserRoleById(event.locals.user.id, 'MODERATOR');
				}

				const filteredUser: Partial<TUser> = {
					id: updatedUser.id,
					role: updatedUser.role,
					username: updatedUser.username,
					profilePictureUrl: updatedUser.profilePictureUrl,
					superRolePromotionAt: updatedUser.superRolePromotionAt,
				};

				return createSuccessResponse(
					'api-route',
					`Successfully updated the user role of the user: ${targetUsername} to ${newRole}`,
					filteredUser,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to update the user role',
				);
			}
		},
		true,
	);
};
