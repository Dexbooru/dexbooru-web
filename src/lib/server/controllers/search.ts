import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import { normalizeQuery } from '$lib/shared/helpers/search';
import type { TPost, TPostOrderByColumn } from '$lib/shared/types/posts';
import type { TAppSearchResult } from '$lib/shared/types/search';
import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { boolStrSchema, pageNumberSchema } from '../constants/reusableSchemas';
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
import type { TControllerHandlerVariant, TRequestSchema } from '../types/controllers';

type TSearchResults = {
	posts: TPost[];
	limit: number;
	pageNumber: number;
	orderBy: string;
	ascending: boolean;
};

const getCacheKeyAdvanced = (
	query: string,
	limit: number,
	pageNumber: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
) => {
	return `${query}-${limit}-${pageNumber}-${orderBy}-${ascending}`;
};

const getCacheKeyGeneral = (query: string, searchSection: string, limit: number) => {
	return `${query}-${searchSection}-${limit}`;
};

const CACHE_TIME_SECONDS = 60;
const CACHE_TIME_NO_RESULTS_SECONDS = 300;

const limitSchema = z
	.string()
	.optional()
	.default(`${MAXIMUM_POSTS_PER_PAGE}`)
	.transform((val) => parseInt(val, 10))
	.refine((val) => !isNaN(val), { message: 'Invalid limit, must be a number' });

const AdvancedPostSearchResultsSchema = {
	urlSearchParams: z.object({
		query: z
			.string()
			.min(1, 'The query length needs to be least one character long')
			.transform((val) => {
				const tokens = normalizeQuery(val).split(' ');
				return tokens.toSorted().join(' ');
			}),
		limit: limitSchema,
		pageNumber: pageNumberSchema,
		orderBy: z
			.union([
				z.literal('views'),
				z.literal('likes'),
				z.literal('createdAt'),
				z.literal('updatedAt'),
				z.literal('commentCount'),
			])
			.default('createdAt'),
		ascending: boolStrSchema,
	}),
} satisfies TRequestSchema;

const GetSearchResultsSchema = {
	urlSearchParams: z.object({
		query: z
			.string()
			.min(1, 'The query length needs to be least one character one long')
			.transform((val) => normalizeQuery(val)),
		limit: limitSchema,
		searchSection: z
			.union([
				z.literal('posts'),
				z.literal('tags'),
				z.literal('artists'),
				z.literal('users'),
				z.literal('collections'),
				z.literal('all'),
			])
			.default('all'),
	}),
} satisfies TRequestSchema;

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
						searchResponse.posts.length === 0 ? CACHE_TIME_NO_RESULTS_SECONDS : CACHE_TIME_SECONDS,
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

					cacheResponseRemotely(cacheKey, finalSearchResults, CACHE_TIME_SECONDS);
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
