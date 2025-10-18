import { MAXIMUM_COMMENTS_PER_PAGE } from '$lib/shared/constants/comments';
import { MAXIMUM_COMMENTS_PER_POST } from '$lib/shared/constants/posts';
import { isModerationRole } from '$lib/shared/helpers/auth/role';
import type { TComment, TCommentPaginationData } from '$lib/shared/types/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { GENERAL_COMMENTS_SELECTORS, PUBLIC_COMMENT_SELECTORS } from '../constants/comments';
import {
	createComment,
	deleteCommentById,
	editCommentContentById,
	findCommentById,
	findComments,
	findCommentsByAuthorId,
	findPaginatedCommentsByPostId,
} from '../db/actions/comment';
import { findPostById } from '../db/actions/post';
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
import type { TControllerHandlerVariant } from '../types/controllers';
import { CACHE_TIME_CATEGORY_COMMENTS, getCacheKeyWithCategory } from './cache-strategies/comments';
import { getCacheKeyForIndividualPost } from './cache-strategies/posts';
import {
	CreateCommentSchema,
	DeletePostCommentsSchema,
	EditPostCommentsSchmea,
	GeneralCommentsSchema,
	GetPostCommentsSchema,
} from './request-schemas/comments';

export const handleGetAuthenticatedUserComments = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GeneralCommentsSchema,
		async (data) => {
			const user = event.locals.user;
			const { orderBy, pageNumber } = data.urlSearchParams;

			try {
				const comments = await findCommentsByAuthorId(
					user.id,
					pageNumber,
					MAXIMUM_COMMENTS_PER_PAGE,
					orderBy,
					GENERAL_COMMENTS_SELECTORS,
				);

				const responseData = {
					comments,
					pageNumber,
					orderBy,
					ascending: false,
				};

				return createSuccessResponse(handlerType, 'Comments fetched successfully', responseData);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					"An unexpected error occurred while fetching authenticated user's the comments",
				);
			}
		},
		true,
	);
};

export const handleGetGeneralComments = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GeneralCommentsSchema, async (data) => {
		const { orderBy, ascending, pageNumber } = data.urlSearchParams;
		const cacheKey = getCacheKeyWithCategory(pageNumber, orderBy, ascending);
		let responseData: TCommentPaginationData;

		try {
			const cachedData = await getRemoteResponseFromCache<TCommentPaginationData>(cacheKey);
			if (cachedData) {
				responseData = cachedData;
			} else {
				const comments = (await findComments(
					pageNumber,
					orderBy,
					ascending,
					GENERAL_COMMENTS_SELECTORS,
				)) as TComment[];

				responseData = {
					comments,
					pageNumber,
					orderBy,
					ascending,
				};

				cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_CATEGORY_COMMENTS);
			}

			return createSuccessResponse(handlerType, 'Comments fetched successfully', responseData);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occurred while fetching the comments',
			);
		}
	});
};

export const handleDeletePostComment = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeletePostCommentsSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const commentId = data.urlSearchParams.commentId;

			try {
				const comment = (await findCommentById(commentId, {
					postId: true,
					authorId: true,
					author: { select: { role: true } },
				})) as TComment;
				if (!comment) {
					return createErrorResponse(
						'api-route',
						404,
						`A comment with the id: ${commentId} does not exist`,
					);
				}

				if (comment.postId !== postId) {
					return createErrorResponse(
						'api-route',
						400,
						`The comment's post id does not match: ${postId}`,
					);
				}

				if (comment.authorId !== event.locals.user.id && !isModerationRole(comment.author.role)) {
					return createErrorResponse(
						'api-route',
						403,
						`The authenticated user with id: ${event.locals.user.id} does not match the comment's author id or they do not have moderator permissions`,
					);
				}

				if (comment.authorId !== event.locals.user.id && isModerationRole(comment.author.role)) {
					await editCommentContentById(
						commentId,
						'This comment has been removed by a site moderator',
					);
				} else {
					await deleteCommentById(commentId, postId);
				}

				const postCacheKey = getCacheKeyForIndividualPost(postId);
				invalidateCacheRemotely(postCacheKey);

				return createSuccessResponse(
					'api-route',
					`A comment with the id: ${commentId} and its corresponding replies were deleted successfuly!`,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while deleting the post comment',
				);
			}
		},
		true,
	);
};

export const handleUpdatePostComment = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		EditPostCommentsSchmea,
		async (data) => {
			const postId = data.pathParams.postId;
			const { commentId, content } = data.body;

			try {
				const comment = await findCommentById(commentId);
				if (!comment) {
					return createErrorResponse(
						'api-route',
						404,
						`A comment with the id: ${commentId} does not exist`,
					);
				}

				if (comment.postId !== postId) {
					return createErrorResponse(
						'api-route',
						400,
						`The comment's post id does not match: ${postId}`,
					);
				}

				if (comment.authorId !== event.locals.user.id) {
					return createErrorResponse(
						'api-route',
						403,
						`The authenticated user with id: ${event.locals.user.id} does not match the comment's author id`,
					);
				}

				const updatedComment = await editCommentContentById(commentId, content);

				const postCacheKey = getCacheKeyForIndividualPost(postId);
				invalidateCacheRemotely(postCacheKey);

				return createSuccessResponse(
					'api-route',
					`Successfully edited the comment content for the id: ${commentId}`,
					updatedComment,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to update the comment',
				);
			}
		},
		true,
	);
};

export const handleGetPostComments = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetPostCommentsSchema, async (data) => {
		const postId = data.pathParams.postId;
		const parentCommentId = data.urlSearchParams.parentCommentId;
		const pageNumber = data.urlSearchParams.pageNumber;

		try {
			const post = await findPostById(postId, { id: true });
			if (!post) {
				return createErrorResponse(
					'api-route',
					404,
					`A post with the id: ${postId} does not exist`,
				);
			}

			const comments = await findPaginatedCommentsByPostId(
				postId,
				parentCommentId === 'null' ? null : parentCommentId,
				pageNumber,
				MAXIMUM_COMMENTS_PER_PAGE,
				PUBLIC_COMMENT_SELECTORS,
			);

			return createSuccessResponse('api-route', 'Comments fetched successfully', comments);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				'api-route',
				500,
				'An unexpected error occurred while fetching the comments',
			);
		}
	});
};

export const handleCreatePostComment = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreateCommentSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const { parentCommentId, content } = data.body;

			try {
				const post = await findPostById(postId, {
					commentCount: true,
				});
				if (!post) {
					return createErrorResponse(
						'api-route',
						404,
						`A post with the id: ${postId} does not exist`,
					);
				}

				if (post.commentCount === MAXIMUM_COMMENTS_PER_POST) {
					return createErrorResponse(
						'api-route',
						400,
						`The maximum number of comments that are allowed per post is: ${MAXIMUM_COMMENTS_PER_POST}`,
					);
				}

				const newComment = await createComment(
					event.locals.user.id,
					postId,
					content,
					parentCommentId,
				);
				const { id: newCommentId } = newComment;

				const postCacheKey = getCacheKeyForIndividualPost(postId);
				invalidateCacheRemotely(postCacheKey);

				return createSuccessResponse(
					'api-route',
					`Successfully created a new comment with id: ${newCommentId}`,
					newComment,
					201,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while creating the comment',
				);
			}
		},
		true,
	);
};
