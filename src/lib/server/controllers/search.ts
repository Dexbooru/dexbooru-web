import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import type { TPost } from '$lib/shared/types/posts';
import type { TAppSearchResult } from '$lib/shared/types/search';
import type { RequestEvent } from '@sveltejs/kit';
import {
	searchAllSections,
	searchForArtists,
	searchForCollections,
	searchForPosts,
	searchForTags,
	searchForUsers,
} from '../db/actions/search';
import prisma from '../db/prisma';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import QueryBuilder from '../helpers/search';
import { cacheResponseRemotely, getRemoteResponseFromCache } from '../helpers/sessions';
import type { TControllerHandlerVariant } from '../types/controllers';
import {
	CACHE_TIME_NO_RESULTS_SECONDS,
	CACHE_TIME_RESULTS_SECONDS,
	getCacheKeyAdvanced,
	getCacheKeyGeneral,
} from './cache-strategies/search';
import { AdvancedPostSearchResultsSchema, GetSearchResultsSchema } from './request-schemas/search';

type TSearchResults = {
	posts: TPost[];
	limit: number;
	pageNumber: number;
	orderBy: string;
	ascending: boolean;
};

export const handleGetAdvancedPostSearchResults = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		AdvancedPostSearchResultsSchema,
		async (data) => {
			const { query, limit, pageNumber, orderBy, ascending } = data.urlSearchParams;
			const finalLimit = handlerType === 'page-server-load' ? MAXIMUM_POSTS_PER_PAGE : limit;

			try {
				let searchResponse: TSearchResults;
				const cacheKey = getCacheKeyAdvanced(query, finalLimit, pageNumber, orderBy, ascending);
				const cachedData = await getRemoteResponseFromCache<TSearchResults>(cacheKey);

				if (cachedData) {
					searchResponse = cachedData;
				} else {
					const builder = new QueryBuilder({
						rawQuery: query,
						limit: finalLimit,
						orderBy,
						pageNumber,
						ascending,
						handlerType,
					});
					const ormQuery = builder.buildOrmQuery();
					const searchResults = (await prisma.post.findMany(ormQuery)) as TPost[];

					searchResults.forEach((post) => {
						post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
						post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
					});

					searchResponse = {
						posts: searchResults,
						limit: finalLimit,
						pageNumber,
						orderBy,
						ascending,
					};

					cacheResponseRemotely(
						cacheKey,
						searchResponse,
						searchResponse.posts.length === 0
							? CACHE_TIME_NO_RESULTS_SECONDS
							: CACHE_TIME_RESULTS_SECONDS,
					);
				}

				return createSuccessResponse(
					handlerType,
					'Successfully retrieved search results',
					searchResponse,
				);
			} catch (error) {
				const searchErrorMessage = (error as Error).message;
				return createErrorResponse(
					handlerType,
					500,
					`An unexpected error occured while fetching the search results: ${searchErrorMessage}`,
				);
			}
		},
	);
};

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
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while fetching the search results',
				);
			}
		},
	);
};
