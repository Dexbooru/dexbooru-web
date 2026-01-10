import { TOP_K_LABEL_COUNT } from '$lib/shared/constants/analytics';
import type { RequestEvent } from '@sveltejs/kit';
import { findTopKPopularArtists, findTopKPopularTags } from '../db/actions/analytics';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import type { TControllerHandlerVariant } from '../types/controllers';

const handleGetAnalytics = async (event: RequestEvent, handlerType: TControllerHandlerVariant) => {
	return await validateAndHandleRequest(event, handlerType, {}, async (_) => {
		try {
			const topTags = await findTopKPopularTags(TOP_K_LABEL_COUNT);
			const topArtists = await findTopKPopularArtists(TOP_K_LABEL_COUNT);

			return createSuccessResponse(handlerType, 'Successfully fetched analytics data.', {
				topTags,
				topArtists,
			});
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occurred while fetching analytics data.',
			);
		}
	});
};

export { handleGetAnalytics };
