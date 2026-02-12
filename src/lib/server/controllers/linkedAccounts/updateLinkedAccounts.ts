import type { UserAuthenticationSource } from '$generated/prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import {
	findLinkedAccountsFromUserId,
	updateLinkedAccountsForUserFromId,
} from '../../db/actions/linkedAccount';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { UpdateUserLinkedAccountsSchema } from '../request-schemas/linkedAccounts';

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
