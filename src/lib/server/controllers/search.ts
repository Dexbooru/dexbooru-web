import { DEFAULT_RESULTS_LIMIT, VALID_SEARCH_SECTIONS } from "$lib/shared/constants/search";
import { normalizeQuery } from "$lib/shared/helpers/search";
import { getUrlFields } from "$lib/shared/helpers/urls";
import type { IAppSearchParams, IAppSearchResult, TSearchSection } from "$lib/shared/types/search";
import type { RequestEvent } from "@sveltejs/kit";
import { searchAllSections, searchForArtists, searchForPosts, searchForTags, searchForUsers } from "../db/actions/search";
import { createErrorResponse, createSuccessResponse } from "../helpers/controllers";

export const getSearchResults = async ({ url }: RequestEvent) => {
    const { query, limit, searchSection }: IAppSearchParams = getUrlFields<IAppSearchParams>(
        url.searchParams
    );

    if (query === null || query === undefined) {
        return createErrorResponse('api-route', 400, 'At least one of the required fields was missing');
    }

    if (query.length === 0) {
        return createErrorResponse('api-route', 400, 'The search query cannot be empty');
    }

    if (
        searchSection !== undefined &&
        (!searchSection.length || !VALID_SEARCH_SECTIONS.includes(searchSection))
    ) {
        return createErrorResponse('api-route', 400, `The search section needs to be one of the following options: ${VALID_SEARCH_SECTIONS.join(', ')}`);
    }

    const finalLimit = limit ? limit : DEFAULT_RESULTS_LIMIT;
    const finalSearchSection: TSearchSection = searchSection ? searchSection : 'all';
    const normalizedQuery = normalizeQuery(query);

    let finalSearchResults: IAppSearchResult | null = null;

    switch (finalSearchSection) {
        case 'all':
            finalSearchResults = await searchAllSections(normalizedQuery, finalLimit);
            break;
        case 'artists':
            finalSearchResults = await searchForArtists(normalizedQuery, finalLimit);
            break;
        case 'tags':
            finalSearchResults = await searchForTags(normalizedQuery, finalLimit);
            break;
        case 'users':
            finalSearchResults = await searchForUsers(normalizedQuery, finalLimit);
            break;
        case 'posts':
            finalSearchResults = await searchForPosts(normalizedQuery, finalLimit);
            break;
    }

    return createSuccessResponse('api-route', `Successfully retrieved ${finalLimit} search results for the query: ${query}`, finalSearchResults);
};  