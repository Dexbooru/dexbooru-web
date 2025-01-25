import type { UserAuthenticationSource } from '@prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { boolStrSchema } from '../constants/reusableSchemas';
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
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';

const GetUserLinkedAccountsSchema = {
	pathParams: z.object({
		username: z.string().min(1, { message: 'Username is required' }),
	}),
} satisfies TRequestSchema;

const UpdateUserLinkedAccountsSchema = {
	form: z.object({
		disconnectedLinkedAccounts: z
			.string()
			.transform(
				(value) =>
					value
						.split(',')
						.filter((platform) =>
							['GOOGLE', 'GITHUB', 'DISCORD'].includes(platform),
						) as UserAuthenticationSource[],
			),
		isGooglePublic: boolStrSchema,
		isGithubPublic: boolStrSchema,
		isDiscordPublic: boolStrSchema,
	}),
} satisfies TRequestSchema;

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
				console.error(error);
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
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching linked account',
				);
			}
		},
	);
};
