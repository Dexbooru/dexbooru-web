import { findPostsByArtistName } from '../../db/actions/artist';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import {
	getRemoteResponseFromCache,
	cacheResponseRemotely,
	cacheMultipleToCollectionRemotely,
} from '../../helpers/sessions';
import {
	getCacheKeyWithPostCategoryWithLabel,
	getCacheKeyForIndividualPostKeys,
	CACHE_TIME_ARTIST_POSTS,
} from '../cache-strategies/posts';
import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../../constants/posts';
import { GetPostsWithArtistNameSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TPostPaginationData, TPostOrderByColumn } from '$lib/shared/types/posts';

export const handleGetPostsWithArtistName = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetPostsWithArtistNameSchema,
		async (data) => {
			const artistName = data.pathParams.name;
			const { ascending, orderBy, pageNumber } = data.urlSearchParams;
			const selectors =
				handlerType === 'page-server-load'
					? PAGE_SERVER_LOAD_POST_SELECTORS
					: PUBLIC_POST_SELECTORS;

			let responseData: TPostPaginationData;
			const cacheKey = getCacheKeyWithPostCategoryWithLabel(
				'artist',
				artistName,
				pageNumber,
				orderBy,
				ascending,
			);

			try {
				const cachedData = await getRemoteResponseFromCache<TPostPaginationData>(cacheKey);
				if (cachedData) {
					responseData = cachedData;
				} else {
					const posts = await findPostsByArtistName(
						artistName,
						pageNumber,
						MAXIMUM_POSTS_PER_PAGE,
						orderBy as TPostOrderByColumn,
						ascending,
						selectors,
					);

					posts.forEach((post) => {
						post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
						post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
					});

					responseData = {
						posts,
						pageNumber,
						ascending,
						orderBy: orderBy as TPostOrderByColumn,
					};

					cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_ARTIST_POSTS);
					cacheMultipleToCollectionRemotely(
						posts.map((post) => getCacheKeyForIndividualPostKeys(post.id)),
						cacheKey,
					);
				}

				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the artist name of: ${artistName}`,
					responseData,
				);
			} catch (error) {
				logger.error(error);

				const errorResponse = createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while fetching the posts with artists with a certain name',
				);

				if (handlerType === 'page-server-load') {
					throw errorResponse;
				}

				return errorResponse;
			}
		},
	);
};
