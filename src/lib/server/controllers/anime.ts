import type { RequestEvent } from '@sveltejs/kit';
import { JikanApi } from '../helpers/jikan';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import type { TControllerHandlerVariant } from '../types/controllers';
import { AnimeSearchSchema } from './request-schemas/anime';

export const handleGetAnimeSearchResults = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, AnimeSearchSchema, async (data) => {
		const { title } = data.pathParams;
		const { page, limit } = data.urlSearchParams;

		const transformedTitle = title
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		try {
			const jikanResults = await JikanApi.searchAnime({
				q: transformedTitle,
				page: page + 1,
				limit,
			});

			return createSuccessResponse(handlerType, 'Successfully retrieved anime search results', {
				...jikanResults,
				transformedTitle,
			});
		} catch (error) {
			const errorMessage = (error as Error).message;
			return createErrorResponse(
				handlerType,
				500,
				`An unexpected error occurred while fetching anime results: ${errorMessage}`,
			);
		}
	});
};
