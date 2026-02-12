import type { RequestEvent } from '@sveltejs/kit';
import { createFriendRequest } from '../../db/actions/friend';
import { findUserByName } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { CreateFriendRequestSchema } from '../request-schemas/friends';

export const handleSendFriendRequest = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreateFriendRequestSchema,
		async (data) => {
			const receiverUsername = data.pathParams.username;
			const user = event.locals.user;

			try {
				const receiverUser = await findUserByName(receiverUsername, { username: true, id: true });
				if (!receiverUser) {
					return createErrorResponse(
						'api-route',
						404,
						`A user called ${receiverUsername} does not exist`,
					);
				}

				if (user.id === receiverUser.id) {
					return createErrorResponse(
						'api-route',
						409,
						'You cannot send a friend request to yourself',
					);
				}

				const newFriendRequest = await createFriendRequest(user.id, receiverUser.id);
				return createSuccessResponse(
					'api-route',
					`Successfully sent the friend request to ${receiverUsername}`,
					{ friendRequest: newFriendRequest },
					201,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to send the friend request',
				);
			}
		},
		true,
	);
};
