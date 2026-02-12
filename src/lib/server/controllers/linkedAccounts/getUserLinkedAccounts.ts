import type { RequestEvent } from '@sveltejs/kit';
import { findLinkedAccountsFromUserId } from '../../db/actions/linkedAccount';
import { findUserByName } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { GetUserLinkedAccountsSchema } from '../request-schemas/linkedAccounts';

export const handleGetUserLinkedAccounts = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetUserLinkedAccountsSchema,
		async (data) => {
			const username = data.pathParams.username;

			try {
				const user = await findUserByName(username);
				if (!user) {
					return createErrorResponse('api-route', 404, 'User not found');
				}

				const isSelf = user.id === event.locals.user.id;
				const linkedAccounts = await findLinkedAccountsFromUserId(user.id, isSelf);

				return createSuccessResponse('api-route', 'Linked accounts fetched successfully', {
					linkedAccounts,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching linked account',
				);
			}
		},
	);
};
