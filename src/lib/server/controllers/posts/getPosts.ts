import type { PostModerationStatus } from '$generated/prisma/client';
import { findPostsByAuthorId, findPostsByPage } from '../../db/actions/post';
import { findLikedPostsByAuthorId } from '../../db/actions/user';
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
	getCacheKeyWithPostCategory,
	getCacheKeyForIndividualPostKeys,
	CACHE_TIME_GENERAL_POSTS,
} from '../cache-strategies/posts';
import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../../constants/posts';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { isModerationRole } from '$lib/shared/helpers/auth/role';
import { GetPostsSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import { redirect, type RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant, TPostFetchCategory } from '../../types/controllers';
import type { TPostPaginationData, TPostOrderByColumn, TPost } from '$lib/shared/types/posts';

export const handleGetPosts = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
	overrideCategory?: TPostFetchCategory,
) => {
	return await validateAndHandleRequest(event, handlerType, GetPostsSchema, async (data) => {
		const category = overrideCategory ?? data.urlSearchParams.category;
		const { ascending, orderBy, pageNumber, userId } = data.urlSearchParams;
		const user = event.locals.user;

		if (user.id === NULLABLE_USER.id && ['uploaded', 'liked'].includes(category)) {
			redirect(302, '/');
		}

		const cacheKey = getCacheKeyWithPostCategory(
			category,
			pageNumber,
			orderBy as TPostOrderByColumn,
			ascending,
		);

		try {
			let responseData: TPostPaginationData;
			const cachedData = await getRemoteResponseFromCache<TPostPaginationData>(cacheKey);

			if (cachedData) {
				responseData = cachedData;
			} else {
				const selectors =
					handlerType === 'page-server-load'
						? PAGE_SERVER_LOAD_POST_SELECTORS
						: PUBLIC_POST_SELECTORS;

				let posts: TPost[] = [];
				switch (category) {
					case 'general':
						posts = await findPostsByPage(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							orderBy as TPostOrderByColumn,
							ascending,
							selectors,
						);
						break;
					case 'liked':
						posts = await findLikedPostsByAuthorId(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							user.id,
							orderBy as TPostOrderByColumn,
							ascending,
							selectors,
						);
						break;
					case 'uploaded': {
						const targetUserId = userId ?? user.id;
						const moderationStatuses: PostModerationStatus[] =
							user.id !== NULLABLE_USER.id &&
							(user.id === targetUserId || isModerationRole(user.role))
								? ['PENDING', 'APPROVED', 'REJECTED']
								: ['PENDING', 'APPROVED'];

						posts = await findPostsByAuthorId(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							targetUserId,
							orderBy as TPostOrderByColumn,
							ascending,
							selectors,
							moderationStatuses,
						);
						break;
					}
				}

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

				cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_GENERAL_POSTS);
				cacheMultipleToCollectionRemotely(
					posts.map((post) => getCacheKeyForIndividualPostKeys(post.id)),
					cacheKey,
				);
			}

			return createSuccessResponse(
				handlerType,
				'Successfully fetched paginated posts',
				responseData,
			);
		} catch (error) {
			logger.error(error);

			const errorResponse = createErrorResponse(
				handlerType,
				500,
				'An unexpected error occurred while fetching the posts',
			);
			if (handlerType === 'page-server-load') {
				throw errorResponse;
			}

			return errorResponse;
		}
	});
};
