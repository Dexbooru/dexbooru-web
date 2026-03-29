import type { RequestEvent } from '@sveltejs/kit';
import redis from '../../db/redis';
import { findPostById, likePostById } from '../../db/actions/post';
import { LIKE_POST_RATE_LIMIT, REDIS_RATE_LIMIT_KEY_POST_LIKE } from '../../constants/rateLimit';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import {
	getRemoteAssociatedKeys,
	invalidateCacheRemotely,
	invalidateMultipleCachesRemotely,
} from '../../helpers/sessions';
import logger from '../../logging/logger';
import {
	getCacheKeyForIndividualPost,
	getCacheKeyForIndividualPostKeys,
	getCacheKeyWithPostCategory,
} from '../cache-strategies/posts';
import { LikePostSchema } from '../request-schemas/posts';
import newPostLikePublisher, { NewPostLikePublisher } from '../../rabbitmq/publishers/newPostLike';
import {
	consumeRateLimit,
	rateLimitExceededApiResponse,
	sanitizeClientAddressForRateLimitKey,
} from '../../middleware/rateLimit';

export const handleLikePost = async (event: RequestEvent) => {
	const rateLimitResult = await consumeRateLimit(redis, {
		keyPrefix: REDIS_RATE_LIMIT_KEY_POST_LIKE,
		identifier: `${sanitizeClientAddressForRateLimitKey(event.getClientAddress())}:${
			event.locals.user.id
		}`,
		rule: LIKE_POST_RATE_LIMIT,
	});
	if (!rateLimitResult.ok) {
		return rateLimitExceededApiResponse(rateLimitResult.retryAfterSeconds);
	}

	return await validateAndHandleRequest(
		event,
		'api-route',
		LikePostSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const action = data.body.action;
			const individualPostCacheKey = getCacheKeyForIndividualPost(postId);
			const postListAssociationKey = getCacheKeyForIndividualPostKeys(postId);
			const userLikedPostsCacheKey = getCacheKeyWithPostCategory(
				'liked',
				0,
				'createdAt',
				false,
				event.locals.user.id,
			);

			try {
				const post = await findPostById(postId, { likes: true, authorId: true });
				if (!post) {
					return createErrorResponse(
						'api-route',
						404,
						`A post with the id: ${postId} does not exist`,
					);
				}

				const likedPost = await likePostById(postId, action, event.locals.user.id);
				if (!likedPost) {
					return createErrorResponse(
						'api-route',
						500,
						'An unexpected error occured while liking the post',
					);
				}

				if (action === 'like' && post.authorId && post.authorId !== event.locals.user.id) {
					const routingKey = NewPostLikePublisher.buildRoutingKey(post.authorId);
					newPostLikePublisher
						.publish(routingKey, {
							postId,
							postAuthorId: post.authorId,
							likerUserId: event.locals.user.id,
							totalLikes: (post.likes ?? 0) + 1,
							wasRead: false,
						})
						.catch((err) => logger.error('Failed to publish new post like event', err));
				}

				const listCacheKeysToInvalidate = await getRemoteAssociatedKeys(postListAssociationKey);
				await Promise.all([
					invalidateMultipleCachesRemotely(listCacheKeysToInvalidate),
					invalidateCacheRemotely(postListAssociationKey),
					invalidateCacheRemotely(individualPostCacheKey),
					invalidateCacheRemotely(userLikedPostsCacheKey),
				]);

				return createSuccessResponse(
					'api-route',
					`The post with the id: ${postId} was successfully ${
						action === 'like' ? 'liked' : 'disliked'
					}`,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while liking the post',
				);
			}
		},
		true,
	);
};
