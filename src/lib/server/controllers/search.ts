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

const getCacheKey = (
	query: string,
	limit: number,
	pageNumber: number,
	orderBy: TPostOrderByColumn,
	ascending: boolean,
) => {
	return `${query}-${limit}-${pageNumber}-${orderBy}-${ascending}`;
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
		query: z.string().min(1, 'The query length needs to be least one character long'),
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
			.transform((val) => {
				const tokens = val.trim().split(' ');
				return tokens.toSorted().join(' ');
			}),
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
				const cacheKey = getCacheKey(query, finalLimit, pageNumber, orderBy, ascending);
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
				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while fetching the search results',
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
			const normalizedQuery = normalizeQuery(query);

			try {
				let finalSearchResults: TAppSearchResult | null = null;

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
					case 'collections':
						finalSearchResults = await searchForCollections(normalizedQuery, limit);
						break;
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
