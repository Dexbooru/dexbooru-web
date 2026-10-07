import type { RequestEvent } from '@sveltejs/kit';
import { listAvailableSauceNaoIndexes } from '$lib/server/db/actions/sauceNaoIndex';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '$lib/server/helpers/controllers';
import logger from '$lib/server/logging/logger';
import { SauceNaoIndexesGetSchema } from '../request-schemas/sauceNao';
import { handleOwnerRoleCheck } from '../moderation/ownerRoleCheck';

export const handleGetSauceNaoIndexes = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		SauceNaoIndexesGetSchema,
		async () => {
			try {
				const ownerFailure = await handleOwnerRoleCheck(event, 'api-route');
				if (ownerFailure) return ownerFailure;

				const sauceNaoIndexes = await listAvailableSauceNaoIndexes();
				return createSuccessResponse(
					'api-route',
					'Successfully fetched SauceNAO indexes.',
					sauceNaoIndexes,
				);
			} catch (error) {
				logger.error(error);
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching SauceNAO indexes.',
				);
			}
		},
		true,
	);
};
