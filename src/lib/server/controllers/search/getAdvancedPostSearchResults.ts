import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import type { TPost } from '$lib/shared/types/posts';
import type { RequestEvent } from '@sveltejs/kit';
import prisma from '../../db/prisma';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { hydratePostsTagAndArtistEntities } from '../../helpers/postHydration';
import QueryBuilder from '../../helpers/search';
import type { TControllerHandlerVariant } from '../../types/controllers';
import {
	CACHE_TIME_NO_RESULTS_SECONDS,
	CACHE_TIME_RESULTS_SECONDS,
	getCacheKeyAdvanced,
} from '../cache-strategies/search';
import { AdvancedPostSearchResultsSchema } from '../request-schemas/search';
import { withRemoteCache } from '../strategies/withRemoteCache';

export type TSearchResults = {
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
				const cacheKey = getCacheKeyAdvanced(query, finalLimit, pageNumber, orderBy, ascending);
				const searchResponse = await withRemoteCache<TSearchResults>({
					cacheKey,
					ttlSeconds: CACHE_TIME_RESULTS_SECONDS,
					resolveTtl: (result) =>
						result.posts.length === 0 ? CACHE_TIME_NO_RESULTS_SECONDS : CACHE_TIME_RESULTS_SECONDS,
					compute: async () => {
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

						hydratePostsTagAndArtistEntities(searchResults);

						return {
							posts: searchResults,
							limit: finalLimit,
							pageNumber,
							orderBy,
							ascending,
						};
					},
				});

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
