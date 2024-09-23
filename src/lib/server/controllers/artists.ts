import type { RequestEvent } from "@sveltejs/kit";
import { ARTISTS_PAGINATION_CACHE_TIME_SECONDS } from "../constants/sessions";
import { getArtistsWithStartingLetter } from "../db/actions/artist";
import { createErrorResponse, createSuccessResponse } from "../helpers/controllers";
import { processPageNumberFromParams } from "../helpers/pagination";
import { cacheResponse } from "../helpers/sessions";

export const handleGetArtists = async ({ params, setHeaders, url }: RequestEvent) => {
    const letter = params.letter;

    if (!letter || letter.length > 1) {
        return createErrorResponse('api-route', 400, 'The letter should be a single non-empty character');
    }

    const pageNumber = processPageNumberFromParams(url.searchParams);

    const artists = await getArtistsWithStartingLetter(letter, pageNumber);

    cacheResponse(setHeaders, ARTISTS_PAGINATION_CACHE_TIME_SECONDS);

    return createSuccessResponse('api-route', `Successfully fetched artists starting with the letter: ${letter} and on page number: ${pageNumber}`, artists);
}