import { MAXIMUM_COMMENTS_PER_POST } from '$lib/shared/constants/posts';
import type { RequestEvent } from '@sveltejs/kit';
import { createComment, findCommentById } from '../../db/actions/comment';
import { findPostById } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import logger from '../../logging/logger';
import {
	getCacheKeyForIndividualPost,
	getCacheKeyWithPostCategory,
} from '../cache-strategies/posts';
import { CreateCommentSchema } from '../request-schemas/comments';
import newPostCommentPublisher, {
	NewPostCommentPublisher,
} from '../../rabbitmq/publishers/newPostComment';

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
					authorId: true,
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

				if (post.authorId) {
					let parentCommentAuthorId: string | null = null;
					if (parentCommentId) {
						const parentComment = await findCommentById(parentCommentId, {
							authorId: true,
						});
						parentCommentAuthorId = parentComment?.authorId ?? null;
					}

					const routingKey = NewPostCommentPublisher.buildRoutingKey(post.authorId);
					newPostCommentPublisher
						.publish(routingKey, {
							postId,
							postAuthorId: post.authorId,
							commentAuthorId: event.locals.user.id,
							commentContent: content,
							parentCommentId: parentCommentId ?? null,
							parentCommentAuthorId,
							wasRead: false,
						})
						.catch((err) => logger.error('Failed to publish new post comment event', err));
				}

				const postCacheKey = getCacheKeyForIndividualPost(postId);
				invalidateCacheRemotely(postCacheKey);

				const commentsPostsOrderCacheKey = getCacheKeyWithPostCategory(
					'general',
					0,
					'commentCount',
					false,
				);
				invalidateCacheRemotely(commentsPostsOrderCacheKey);

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
