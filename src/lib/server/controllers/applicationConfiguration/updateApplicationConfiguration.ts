import type { RequestEvent } from '@sveltejs/kit';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '$lib/server/helpers/controllers';
import logger from '$lib/server/logging/logger';
import {
	getApplicationConfiguration,
	publishApplicationConfigurationUpdate,
	setApplicationConfigurationInMemory,
	setApplicationConfigurationInRedis,
	syncDatabaseVarcharConstraints,
	validateApplicationConfigurationUpdate,
} from '$lib/server/applicationConfiguration';
import { updateApplicationConfiguration as updateApplicationConfigurationInDb } from '$lib/server/db/actions/applicationConfiguration';
import { applicationConfigurationEmitter } from '$lib/server/events/applicationConfiguration';
import { handleOwnerRoleCheck } from '../moderation/ownerRoleCheck';
import { ApplicationConfigurationUpdateSchema } from '../request-schemas/applicationConfiguration';

export const handleUpdateApplicationConfiguration = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		ApplicationConfigurationUpdateSchema,
		async (data) => {
			try {
				const ownerFailure = await handleOwnerRoleCheck(event, 'api-route');
				if (ownerFailure) return ownerFailure;

				const currentConfiguration = await getApplicationConfiguration();
				await validateApplicationConfigurationUpdate(data.body, currentConfiguration);

				const updatedConfiguration = await updateApplicationConfigurationInDb(data.body);
				await syncDatabaseVarcharConstraints(updatedConfiguration);
				setApplicationConfigurationInMemory(updatedConfiguration);
				await setApplicationConfigurationInRedis(updatedConfiguration);
				await publishApplicationConfigurationUpdate(updatedConfiguration);
				applicationConfigurationEmitter.emitUpdated(updatedConfiguration);

				return createSuccessResponse(
					'api-route',
					'Successfully updated application configuration.',
					updatedConfiguration,
				);
			} catch (error) {
				logger.error(error);
				return createErrorResponse(
					'api-route',
					500,
					(error as Error).message ||
						'An unexpected error occurred while updating application configuration.',
				);
			}
		},
		true,
	);
};
