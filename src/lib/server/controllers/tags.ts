import type { RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
import { ARTISTS_PAGINATION_CACHE_TIME_SECONDS } from "../constants/sessions";
import { getTagsWithStartingLetter } from "../db/actions/tag";
import { createErrorResponse, createSuccessResponse, validateAndHandleRequest } from "../helpers/controllers";
import { cacheResponse } from "../helpers/sessions";
import type { TRequestSchema } from "../types/controllers";

const GetTagsSchema = {
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

export const handleGetTags = async (event: RequestEvent) => {
    return await validateAndHandleRequest(event, 'api-route', GetTagsSchema,
        async data => {
            try {
                const letter = data.pathParams.letter;
                const pageNumber = data.urlSearchParams.pageNumber;

                const artists = await getTagsWithStartingLetter(letter, pageNumber);

                cacheResponse(event.setHeaders, ARTISTS_PAGINATION_CACHE_TIME_SECONDS);

                return createSuccessResponse('api-route', `Successfully fetched tags starting with the letter: ${letter} and on page number: ${pageNumber}`, artists);
            } catch (error) {
                return createErrorResponse('api-route', 500, 'An unexpected error occured while fetching the tags');
            }
        },
    )
}
