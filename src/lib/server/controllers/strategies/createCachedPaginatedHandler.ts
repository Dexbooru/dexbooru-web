import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import type { TPostOrderByColumn, TPostPaginationData } from '$lib/shared/types/posts';
import type { RequestEvent } from '@sveltejs/kit';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../../constants/posts';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { hydratePostsTagAndArtistEntities } from '../../helpers/postHydration';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { getCacheKeyForIndividualPostKeys } from '../cache-strategies/posts';
import type { TPostsByLabelStrategy } from './types';
import { withRemoteCache } from './withRemoteCache';

export function createCachedPaginatedHandler(strategy: TPostsByLabelStrategy) {
	return async (event: RequestEvent, handlerType: TControllerHandlerVariant) => {
		return await validateAndHandleRequest(event, handlerType, strategy.schema, async (data) => {
			const label = strategy.getLabel(data);
			const { ascending, orderBy, pageNumber } = data.urlSearchParams as {
				ascending: boolean;
				orderBy: TPostOrderByColumn;
				pageNumber: number;
			};
			const selectors =
				handlerType === 'page-server-load'
					? PAGE_SERVER_LOAD_POST_SELECTORS
					: PUBLIC_POST_SELECTORS;

			// Partition by handler type so page-server-load selectors never collide with api-route.
			const cacheKey = `${strategy.buildCacheKey(
				label,
				pageNumber,
				orderBy as TPostOrderByColumn,
				ascending,
			)}-${handlerType}`;
			const shouldCache = strategy.shouldCache?.(handlerType) ?? true;

			try {
				const responseData = await withRemoteCache({
					cacheKey,
					ttlSeconds: strategy.cacheTtlSeconds,
					shouldCache,
					getAssociateKeys: (computed) => {
						if (!('posts' in computed) || !Array.isArray(computed.posts)) {
							return [];
						}
						return (computed.posts as { id: string }[]).map((post) =>
							getCacheKeyForIndividualPostKeys(post.id),
						);
					},
					compute: async () => {
						const posts = await strategy.findPosts({
							label,
							pageNumber,
							pageLimit: MAXIMUM_POSTS_PER_PAGE,
							orderBy: orderBy as TPostOrderByColumn,
							ascending,
							selectors,
						});

						hydratePostsTagAndArtistEntities(posts);

						const pagination: TPostPaginationData = {
							posts,
							pageNumber,
							ascending,
							orderBy: orderBy as TPostOrderByColumn,
						};

						return strategy.enrichResponse
							? strategy.enrichResponse(pagination, label)
							: pagination;
					},
				});

				return createSuccessResponse(handlerType, strategy.successMessage(label), responseData);
			} catch (error) {
				logger.error(error);

				const errorResponse = createErrorResponse(handlerType, 500, strategy.errorMessage);
				if (handlerType === 'page-server-load') {
					throw errorResponse;
				}

				return errorResponse;
			}
		});
	};
}
