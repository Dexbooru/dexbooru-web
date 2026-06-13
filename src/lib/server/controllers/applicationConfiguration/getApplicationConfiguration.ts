import type { RequestEvent } from '@sveltejs/kit';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '$lib/server/helpers/controllers';
import type { TControllerHandlerVariant } from '$lib/server/types/controllers';
import { getApplicationConfiguration as getAppConfiguration } from '$lib/server/applicationConfiguration';
import logger from '$lib/server/logging/logger';
import { ApplicationConfigurationGetSchema } from '../request-schemas/applicationConfiguration';

export const handleGetApplicationConfiguration = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant = 'api-route',
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		ApplicationConfigurationGetSchema,
		async () => {
			try {
				const applicationConfiguration = await getAppConfiguration();
				return createSuccessResponse(
					handlerType,
					'Successfully fetched application configuration.',
					applicationConfiguration,
				);
			} catch (error) {
				logger.error(error);
				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occurred while fetching application configuration.',
				);
			}
		},
	);
};
