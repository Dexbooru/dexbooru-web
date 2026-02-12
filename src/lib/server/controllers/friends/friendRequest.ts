import type { RequestEvent } from '@sveltejs/kit';
import { deleteFriendRequest } from '../../db/actions/friend';
import { createFriend, findUserByName } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { DeleteFriendRequestSchema } from '../request-schemas/friends';

export const handleFriendRequest = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeleteFriendRequestSchema,
		async (data) => {
			const senderUsername = data.pathParams.username;
			const requestAction = data.urlSearchParams.action;
			const user = event.locals.user;

			try {
				const senderUser = await findUserByName(senderUsername, { id: true });
				if (!senderUser) {
					return createErrorResponse(
						'api-route',
						404,
						`A user called ${senderUsername} does not exist`,
					);
				}

				const deletedFriendRequest = await deleteFriendRequest(user.id, senderUser.id);
				if (!deletedFriendRequest) {
					return createErrorResponse(
						'api-route',
						409,
						`There exists no friend request connection between ${user.id} and ${senderUser.id}`,
					);
				}

				if (requestAction === 'accept') {
					await createFriend(user.id, senderUser.id);
				}

				return createSuccessResponse(
					'api-route',
					`Successfully ${
						requestAction === 'accept' ? 'accepted' : 'declined'
					} friendship request from ${senderUsername}`,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while handling the friend request',
				);
			}
		},
		true,
	);
};
