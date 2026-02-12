import type { RequestEvent } from '@sveltejs/kit';
import { findAllUserFriendRequests, findFriendsForUser } from '../../db/actions/friend';
import { createSuccessResponse, validateAndHandleRequest } from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant, TRequestSchema } from '../../types/controllers';

export const handleGetFriendData = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		{} as TRequestSchema,
		async (_) => {
			const user = event.locals.user;

			try {
				const friends = await findFriendsForUser(user.id);
				const { sentFriendRequests, receivedFriendRequests } = await findAllUserFriendRequests(
					user.id,
				);

				return createSuccessResponse(handlerType, 'Fetched the friend data successfully', {
					friends,
					sentFriendRequests,
					receivedFriendRequests,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while trying to get the friend data',
				);
			}
		},
		true,
	);
};

// Internal import fix: need to import createErrorResponse
import { createErrorResponse } from '../../helpers/controllers';
