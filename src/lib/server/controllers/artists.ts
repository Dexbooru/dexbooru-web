import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { pageNumberSchema } from '../constants/reusableSchemas';
import { ARTISTS_PAGINATION_CACHE_TIME_SECONDS } from '../constants/sessions';
import { getArtistsWithStartingLetter } from '../db/actions/artist';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../helpers/sessions';
import type { TRequestSchema } from '../types/controllers';

const GetArtistsSchema = {
	pathParams: z.object({
		letter: z.string().length(1, 'The letter needs to be a single non-empty character'),
	}),
	urlSearchParams: z.object({
		pageNumber: pageNumberSchema,
	}),
} satisfies TRequestSchema;

const getCacheKey = (pageNumber: number, letter: string) => `artists-${letter}-${pageNumber}`;

export const handleGetArtists = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetArtistsSchema, async (data) => {
		try {
			const letter = data.pathParams.letter;
			const pageNumber = data.urlSearchParams.pageNumber;
			const cacheKey = getCacheKey(pageNumber, letter);

			const artists =
				(await getRemoteResponseFromCache<{ name: string }[]>(cacheKey)) ??
				(await getArtistsWithStartingLetter(letter, pageNumber));

			cacheResponseRemotely(cacheKey, artists, ARTISTS_PAGINATION_CACHE_TIME_SECONDS);

			return createSuccessResponse(
				'api-route',
				`Successfully fetched artists starting with the letter: ${letter} and on page number: ${pageNumber}`,
				artists,
			);
		} catch (error) {
			return createErrorResponse(
				'api-route',
				500,
				'An unexpected error occured while fetching the artists',
			);
		}
	});
};
