import type { TAppSearchResult } from '$lib/shared/types/search';
import { isModerationRole } from '$lib/shared/helpers/auth/role';
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
import logger from '../../logging/logger';
import { CACHE_TIME_RESULTS_SECONDS, getCacheKeyGeneral } from '../cache-strategies/search';
import { GetSearchResultsSchema } from '../request-schemas/search';
import { withRemoteCache } from '../strategies/withRemoteCache';

export const handleGetSearchResults = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetSearchResultsSchema,
		async (data) => {
			const { query, limit, searchSection } = data.urlSearchParams;
			const includeRejectedPosts = isModerationRole(event.locals.user.role);
			const cacheKey = getCacheKeyGeneral(query, searchSection, limit, includeRejectedPosts);

			try {
				const finalSearchResults = await withRemoteCache<TAppSearchResult | null>({
					cacheKey,
					ttlSeconds: CACHE_TIME_RESULTS_SECONDS,
					shouldCache: (result) => result !== null,
					compute: async () => {
						switch (searchSection) {
							case 'all':
								return await searchAllSections(query, limit, includeRejectedPosts);
							case 'artists':
								return await searchForArtists(query, limit);
							case 'tags':
								return await searchForTags(query, limit);
							case 'users':
								return await searchForUsers(query, limit);
							case 'posts':
								return await searchForPosts(query, limit, includeRejectedPosts);
							case 'collections':
								return await searchForCollections(query, limit);
							default:
								return null;
						}
					},
				});

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
