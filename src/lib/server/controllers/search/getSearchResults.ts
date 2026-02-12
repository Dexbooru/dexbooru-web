import type { TAppSearchResult } from '$lib/shared/types/search';
import type { RequestEvent } from '@sveltejs/kit';
import {
	searchAllSections,
	searchForArtists,
	searchForCollections,
	searchForPosts,
	searchForTags,
	searchForUsers,
} from '../../db/actions/search';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../../helpers/sessions';
import logger from '../../logging/logger';
import { CACHE_TIME_RESULTS_SECONDS, getCacheKeyGeneral } from '../cache-strategies/search';
import { GetSearchResultsSchema } from '../request-schemas/search';

export const handleGetSearchResults = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetSearchResultsSchema,
		async (data) => {
			const { query, limit, searchSection } = data.urlSearchParams;
			const cacheKey = getCacheKeyGeneral(query, searchSection, limit);

			try {
				let finalSearchResults: TAppSearchResult | null = null;

				const cachedData = await getRemoteResponseFromCache<TAppSearchResult>(cacheKey);
				if (cachedData) {
					finalSearchResults = cachedData;
				} else {
					switch (searchSection) {
						case 'all':
							finalSearchResults = await searchAllSections(query, limit);
							break;
						case 'artists':
							finalSearchResults = await searchForArtists(query, limit);
							break;
						case 'tags':
							finalSearchResults = await searchForTags(query, limit);
							break;
						case 'users':
							finalSearchResults = await searchForUsers(query, limit);
							break;
						case 'posts':
							finalSearchResults = await searchForPosts(query, limit);
							break;
						case 'collections':
							finalSearchResults = await searchForCollections(query, limit);
							break;
					}

					cacheResponseRemotely(cacheKey, finalSearchResults, CACHE_TIME_RESULTS_SECONDS);
				}

				return createSuccessResponse(
					'api-route',
					`Successfully retrieved ${limit} search results for the query: ${query}`,
					finalSearchResults,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while fetching the search results',
				);
			}
		},
	);
};
