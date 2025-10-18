import type { RequestEvent } from '@sveltejs/kit';
import { getArtistsWithStartingLetter } from '../db/actions/artist';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../helpers/sessions';
import logger from '../logging/logger';
import {
	ARTISTS_PAGINATION_CACHE_TIME_SECONDS,
	getLabelLetterCacheKey,
} from './cache-strategies/labels';
import { GetArtistsSchema } from './request-schemas/artists';

export const handleGetArtists = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetArtistsSchema, async (data) => {
		try {
			const letter = data.pathParams.letter;
			const pageNumber = data.urlSearchParams.pageNumber;
			const cacheKey = getLabelLetterCacheKey('artists', pageNumber, letter);

			const artists =
				(await getRemoteResponseFromCache<{ name: string; postCount: number }[]>(cacheKey)) ??
				(await getArtistsWithStartingLetter(letter, pageNumber));

			cacheResponseRemotely(cacheKey, artists, ARTISTS_PAGINATION_CACHE_TIME_SECONDS);

			return createSuccessResponse(
				'api-route',
				`Successfully fetched artists starting with the letter: ${letter} and on page number: ${pageNumber}`,
				artists,
			);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				'api-route',
				500,
				'An unexpected error occured while fetching the artists',
			);
		}
	});
};
