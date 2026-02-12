import type { RequestEvent } from '@sveltejs/kit';
import { deleteFriend, findUserByName } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { DeleteFriendSchema } from '../request-schemas/friends';

export const handleDeleteFriend = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeleteFriendSchema,
		async (data) => {
			const friendUsername = data.pathParams.username;
			const user = event.locals.user;

			try {
				const friendUser = await findUserByName(friendUsername, { id: true });
				if (!friendUser) {
					return createErrorResponse(
						'api-route',
						404,
						`A user called ${friendUsername} does not exist`,
					);
				}

				const deletedFriend = await deleteFriend(user.id, friendUser.id);
				if (!deletedFriend) {
					return createErrorResponse(
						'api-route',
						409,
						`There was no relationship between ${user.id} and ${friendUser.id} found`,
					);
				}

				return createSuccessResponse(
					'api-route',
					`Successfully unfriended the user with the id: ${friendUsername}`,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to delete the friend',
				);
			}
		},
		true,
	);
};
