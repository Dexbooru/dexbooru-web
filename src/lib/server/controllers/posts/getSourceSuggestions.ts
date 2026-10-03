import type { TSauceNaoSuggestionsResponse } from '$lib/shared/types/sauceNao';
import type { RequestEvent } from '@sveltejs/kit';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { lookupSauceNaoSuggestions } from '../../helpers/sauceNao';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { GetSourceSuggestionsSchema } from '../request-schemas/posts';

export const handleGetSourceSuggestions = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetSourceSuggestionsSchema,
		async (data) => {
			try {
				const bytes = new Uint8Array(await data.form.image.arrayBuffer());
				const result = await lookupSauceNaoSuggestions(bytes);
				if (result.status === 'unavailable') {
					return createErrorResponse(handlerType, 502, 'Could not fetch source suggestions.');
				}
				const response: TSauceNaoSuggestionsResponse = result;
				return createSuccessResponse(
					handlerType,
					'Successfully fetched source suggestions',
					response,
				);
			} catch (error) {
				logger.error(error);
				return createErrorResponse(handlerType, 502, 'Could not fetch source suggestions.');
			}
		},
		true,
	);
};
