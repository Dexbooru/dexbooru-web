import type { RequestEvent } from '@sveltejs/kit';
import { findArtistMetadata } from '../../db/actions/artist';
import { findTagMetadata } from '../../db/actions/tag';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { GetLabelMetadataSchema } from '../request-schemas/labels';

export const handleGetLabelMetadata = async (event: RequestEvent, labelType: 'tag' | 'artist') => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetLabelMetadataSchema,
		async (data) => {
			const { name } = data.pathParams;

			try {
				const labelResource =
					labelType === 'tag' ? await findTagMetadata(name) : await findArtistMetadata(name);
				if (!labelResource) {
					return createErrorResponse(
						'api-route',
						404,
						`The ${labelType} called ${name} does not exist!`,
					);
				}

				return createSuccessResponse(
					'api-route',
					`Successfully fetched ${labelType} called ${name}`,
					labelResource,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					`An unexpected error occurred while fetching the ${labelType} called ${name}.`,
				);
			}
		},
	);
};
