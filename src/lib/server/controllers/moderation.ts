import { isModerationRole } from '$lib/shared/helpers/auth/role';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { findAllModerators, findUserById } from '../db/actions/user';
import { findPostsByPage, updatePost } from '../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import {
	cacheResponseRemotely,
	getRemoteResponseFromCache,
	invalidateCacheRemotely,
} from '../helpers/sessions';
import logger from '../logging/logger';
import {
	GetModerationDashboardSchema,
	GetModeratorsSchema,
	GetPendingPostsSchema,
	UpdatePostModerationStatusSchema,
} from './request-schemas/moderation';
import {
	CACHE_TIME_PENDING_POSTS,
	getCacheKeyForPendingPosts,
} from './cache-strategies/moderation';
import { handleModerationRoleCheck } from './reports';
import { PUBLIC_POST_SELECTORS } from '../constants/posts';
import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import type { TPost } from '$lib/shared/types/posts';

export const handleGetModerationDashboard = async (event: RequestEvent) => {
	// ... existing code ...
	return await validateAndHandleRequest(
		event,
		'page-server-load',
		GetModerationDashboardSchema,
		async (_) => {
			try {
				const user = await findUserById(event.locals.user.id, { role: true });
				if (!user || !isModerationRole(user?.role)) {
					redirect(302, '/');
				}

				return createSuccessResponse(
					'page-server-load',
					'Moderation dashboard loaded successfully',
				);
			} catch (error) {
				if (isRedirect(error)) throw error;

				logger.error(error);

				return createErrorResponse(
					'page-server-load',
					500,
					'An error occurred while loading the moderation dashboard.',
				);
			}
		},
		true,
	);
};

export const handleGetModerators = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetModeratorsSchema,
		async (_) => {
			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const moderators = await findAllModerators();
				return createSuccessResponse('api-route', 'Moderators fetched successfully', {
					moderators,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while fetching moderators.',
				);
			}
		},
		true,
	);
};

export const handleGetPendingPosts = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetPendingPostsSchema,
		async (data) => {
			const { pageNumber } = data.urlSearchParams;
			const cacheKey = getCacheKeyForPendingPosts(pageNumber);

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const cachedData = await getRemoteResponseFromCache<{ pendingPosts: TPost[] }>(cacheKey);
				if (cachedData) {
					return createSuccessResponse(
						'api-route',
						'Pending posts fetched successfully (from cache)',
						cachedData,
					);
				}

				const pendingPosts = await findPostsByPage(
					pageNumber,
					MAXIMUM_POSTS_PER_PAGE,
					'createdAt',
					false,
					PUBLIC_POST_SELECTORS,
					['PENDING'],
				);

				const responseData = { pendingPosts };
				cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_PENDING_POSTS);

				return createSuccessResponse(
					'api-route',
					'Pending posts fetched successfully',
					responseData,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while fetching pending posts.',
				);
			}
		},
		true,
	);
};

export const handleUpdatePostModerationStatus = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UpdatePostModerationStatusSchema,
		async (data) => {
			const { postId } = data.pathParams;
			const { status } = data.body;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const updatedPost = await updatePost(postId, {
					moderationStatus: status,
				});

				invalidateCacheRemotely(getCacheKeyForPendingPosts(0));

				return createSuccessResponse('api-route', 'Post moderation status updated successfully', {
					updatedPost,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while updating post moderation status.',
				);
			}
		},
		true,
	);
};
