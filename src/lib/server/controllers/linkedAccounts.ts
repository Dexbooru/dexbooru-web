import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { deleteAccountLink, getLinkedAccountsForUser } from '../db/actions/linkedAccount';
import { findUserByName } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import type { TRequestSchema } from '../types/controllers';

const GetUserLinkedAccountsSchema = {
	pathParams: z.object({
		username: z.string().min(1, { message: 'Username is required' }),
	}),
} satisfies TRequestSchema;

const DeleteUserLinkedAccountSchema = {
	pathParams: z.object({
		username: z.string().min(1, { message: 'Username is required' }),
	}),
	urlSearchParams: z.object({
		platform: z.enum(['DISCORD', 'GOOGLE', 'GITHUB']),
	}),
} satisfies TRequestSchema;

export const handleDeleteUserLinkedAccount = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeleteUserLinkedAccountSchema,
		async (data) => {
			const { username } = data.pathParams;
			const platform = data.urlSearchParams.platform;
			const user = event.locals.user;

			try {
				if (user.username !== username) {
					return createErrorResponse(
						'api-route',
						403,
						'You are not authorized to unlink this account',
					);
				}

				await deleteAccountLink(user.id, platform);
				
				return createSuccessResponse(
					'api-route',
					`Account unlinked successfully from the platform: ${platform} for the user with the id: ${user.id}`,
				);
			} catch {
				return createErrorResponse('api-route', 500, 'An error occurred while unlinking account');
			}
		},
		true,
	);
};

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
				const linkedAccounts = await getLinkedAccountsForUser(user.id, isSelf);

				return createSuccessResponse('api-route', 'Linked accounts fetched successfully', {
					linkedAccounts,
				});
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while fetching linked account',
				);
			}
		},
	);
};
