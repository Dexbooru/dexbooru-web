import type { RequestEvent } from '@sveltejs/kit';
import {
	listAvailableSauceNaoIndexes,
	setEnabledSauceNaoIndexIds,
} from '$lib/server/db/actions/sauceNaoIndex';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '$lib/server/helpers/controllers';
import logger from '$lib/server/logging/logger';
import { handleOwnerRoleCheck } from '../moderation/ownerRoleCheck';
import { SauceNaoIndexesUpdateSchema } from '../request-schemas/sauceNao';

export const handleSetEnabledSauceNaoIndexes = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		SauceNaoIndexesUpdateSchema,
		async (data) => {
			try {
				const ownerFailure = await handleOwnerRoleCheck(event, 'api-route');
				if (ownerFailure) return ownerFailure;

				const enabledIndexIds = [...new Set(data.body.enabledIndexIds)];
				const catalog = await listAvailableSauceNaoIndexes();
				const availableIds = new Set(catalog.map((index) => index.id));
				const unknownIds = enabledIndexIds.filter((id) => !availableIds.has(id));
				if (unknownIds.length > 0) {
					return createErrorResponse(
						'api-route',
						400,
						`Unknown SauceNAO index id: ${unknownIds.join(', ')}`,
					);
				}

				await setEnabledSauceNaoIndexIds(enabledIndexIds);
				const sauceNaoIndexes = await listAvailableSauceNaoIndexes();
				return createSuccessResponse(
					'api-route',
					'Successfully updated SauceNAO indexes.',
					sauceNaoIndexes,
				);
			} catch (error) {
				logger.error(error);
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while updating SauceNAO indexes.',
				);
			}
		},
		true,
	);
};
