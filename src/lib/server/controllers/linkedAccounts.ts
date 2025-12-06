import type { UserAuthenticationSource } from '$generated/prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import {
	findLinkedAccountsFromUserId,
	updateLinkedAccountsForUserFromId,
} from '../db/actions/linkedAccount';
import { findUserByName } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import type { TControllerHandlerVariant } from '../types/controllers';
import {
	GetUserLinkedAccountsSchema,
	UpdateUserLinkedAccountsSchema,
} from './request-schemas/linkedAccounts';

export const handleUpdateLinkedAccounts = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		UpdateUserLinkedAccountsSchema,
		async (data) => {
			const user = event.locals.user;
			const { disconnectedLinkedAccounts, isDiscordPublic, isGooglePublic, isGithubPublic } =
				data.form;

			try {
				const currentLinkedAccounts = await findLinkedAccountsFromUserId(user.id, true);
				const accountPublicities = {} as Record<UserAuthenticationSource, boolean>;
				currentLinkedAccounts.forEach((linkedAccount) => {
					switch (linkedAccount.platform) {
						case 'DISCORD':
							accountPublicities.DISCORD = isDiscordPublic;
							break;
						case 'GITHUB':
							accountPublicities.GITHUB = isGithubPublic;
							break;
						case 'GOOGLE':
							accountPublicities.GOOGLE = isGooglePublic;
							break;
					}
				});

				const updatedLinkedAccounts = await updateLinkedAccountsForUserFromId(
					user.id,
					disconnectedLinkedAccounts,
					accountPublicities,
				);

				return createSuccessResponse(handlerType, 'Linked accounts updated successfully', {
					updatedLinkedAccounts,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occurred while updating linked accounts',
				);
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
