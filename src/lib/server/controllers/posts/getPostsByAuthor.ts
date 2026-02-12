import { findPostsByAuthorId } from '../../db/actions/post';
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
	getCacheKeyForPostAuthor,
	getCacheKeyForIndividualPostKeys,
	CACHE_TIME_ARTIST_POSTS,
} from '../cache-strategies/posts';
import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../../constants/posts';
import { GetPostsByAuthorSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';
import type { TPostPaginationData, TPostOrderByColumn } from '$lib/shared/types/posts';

export const handleGetPostsByAuthor = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetPostsByAuthorSchema,
		async (data) => {
			const { pageNumber, orderBy, ascending } = data.urlSearchParams;
			const { username } = data.pathParams;

			const cacheKey = getCacheKeyForPostAuthor(
				username,
				pageNumber,
				orderBy as TPostOrderByColumn,
				ascending,
			);
			let responseData: TPostPaginationData & { author: string };

			try {
				const cachedData = await getRemoteResponseFromCache<
					TPostPaginationData & { author: string }
				>(cacheKey);
				if (cachedData) {
					responseData = cachedData;
				} else {
					const selectors =
						handlerType === 'page-server-load'
							? PAGE_SERVER_LOAD_POST_SELECTORS
							: PUBLIC_POST_SELECTORS;
					const posts = await findPostsByAuthorId(
						pageNumber,
						MAXIMUM_POSTS_PER_PAGE,
						username,
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
						author: username,
					};

					if (handlerType === 'page-server-load') {
						cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_ARTIST_POSTS);
						cacheMultipleToCollectionRemotely(
							posts.map((post) => getCacheKeyForIndividualPostKeys(post.id)),
							cacheKey,
						);
					}
				}

				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the author username of: ${username}`,
					responseData,
				);
			} catch (error) {
				logger.error(error);

				const errorResponse = createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while fetching the author posts',
				);
				if (handlerType === 'page-server-load') throw errorResponse;
				return errorResponse;
			}
		},
	);
};
