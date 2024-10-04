import { DEFAULT_RESULTS_LIMIT } from "$lib/shared/constants/search";
import { normalizeQuery } from "$lib/shared/helpers/search";
import type { IAppSearchResult } from "$lib/shared/types/search";
import type { RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
import { searchAllSections, searchForArtists, searchForPosts, searchForTags, searchForUsers } from "../db/actions/search";
import { createErrorResponse, createSuccessResponse, validateAndHandleRequest } from "../helpers/controllers";
import type { TRequestSchema } from "../types/controllers";


const GetSearchResultsSchema = {
    urlSearchParams: z.object({
        query: z.string().min(1, 'The query length needs to be least one character one long'),
        limit: z
            .string()
            .optional()
            .default(`${DEFAULT_RESULTS_LIMIT}`)
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val), { message: 'Invalid limit, must be a number' }),
        searchSection: z.union([z.literal('posts'), z.literal('tags'), z.literal('artists'), z.literal('users'), z.literal('all')]).default('all'),
    })
} satisfies TRequestSchema;

export const handleGetSearchResults = async (event: RequestEvent) => {
    return await validateAndHandleRequest(event, 'api-route', GetSearchResultsSchema,
        async data => {
            const { query, limit, searchSection } = data.urlSearchParams
            const normalizedQuery = normalizeQuery(query);

            try {
                let finalSearchResults: IAppSearchResult | null = null;

                switch (searchSection) {
                    case 'all':
                        finalSearchResults = await searchAllSections(normalizedQuery, limit);
                        break;
                    case 'artists':
                        finalSearchResults = await searchForArtists(normalizedQuery, limit);
                        break;
                    case 'tags':
                        finalSearchResults = await searchForTags(normalizedQuery, limit);
                        break;
                    case 'users':
                        finalSearchResults = await searchForUsers(normalizedQuery, limit);
                        break;
                    case 'posts':
                        finalSearchResults = await searchForPosts(normalizedQuery, limit);
                        break;
                }

                return createSuccessResponse('api-route', `Successfully retrieved ${limit} search results for the query: ${query}`, finalSearchResults);
            } catch (error) {
                return createErrorResponse('api-route', 500, 'An unexpected error occured while fetching the search results');
            }
        }
    )
};