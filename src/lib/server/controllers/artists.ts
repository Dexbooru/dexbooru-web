import type { RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
import { ARTISTS_PAGINATION_CACHE_TIME_SECONDS } from "../constants/sessions";
import { getArtistsWithStartingLetter } from "../db/actions/artist";
import { createErrorResponse, createSuccessResponse, validateAndHandleRequest } from "../helpers/controllers";
import { cacheResponse } from "../helpers/sessions";
import type { TRequestSchema } from "../types/controllers";

const GetArtistsSchema = {
    pathParams: z.object({
        letter: z.string().length(1, 'The letter needs to be a single non-empty character'),
    }),
    urlSearchParams: z.object({
        pageNumber: z
            .string()
            .optional()
            .default('0')
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val), { message: 'Invalid pageNumber, must be a number' }),
    })
} satisfies TRequestSchema;

export const handleGetArtists = async (event: RequestEvent) => {
    return await validateAndHandleRequest(event, 'api-route', GetArtistsSchema,
        async data => {
            try {
                const letter = data.pathParams.letter;
                const pageNumber = data.urlSearchParams.pageNumber;

                const artists = await getArtistsWithStartingLetter(letter, pageNumber);

                cacheResponse(event.setHeaders, ARTISTS_PAGINATION_CACHE_TIME_SECONDS);

                return createSuccessResponse('api-route', `Successfully fetched artists starting with the letter: ${letter} and on page number: ${pageNumber}`, artists);
            } catch (error) {
                return createErrorResponse('api-route', 500, 'An unexpected error occured while fetching the artists');
            }
        }
    );
}
