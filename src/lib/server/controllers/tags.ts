import type { RequestEvent } from "@sveltejs/kit";
import { ARTISTS_PAGINATION_CACHE_TIME_SECONDS } from "../constants/sessions";
import { getTagsWithStartingLetter } from "../db/actions/tag";
import { createErrorResponse, createSuccessResponse } from "../helpers/controllers";
import { processPageNumberFromParams } from "../helpers/pagination";
import { cacheResponse } from "../helpers/sessions";

export const handleGetTags = async ({ params, setHeaders, url }: RequestEvent) => {
    const letter = params.letter;

    if (!letter || letter.length > 1) {
        return createErrorResponse('api-route', 400, 'The letter should be a single non-empty character');
    }

    const pageNumber = processPageNumberFromParams(url.searchParams);

    const artists = await getTagsWithStartingLetter(letter, pageNumber);

    cacheResponse(setHeaders, ARTISTS_PAGINATION_CACHE_TIME_SECONDS);

    return createSuccessResponse('api-route', `Successfully fetched tags starting with the letter: ${letter} and on page number: ${pageNumber}`, artists);
}