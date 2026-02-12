import { findPostById, likePostById } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import { getCacheKeyForIndividualPost } from '../cache-strategies/posts';
import { LikePostSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

export const handleLikePost = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		LikePostSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const action = data.body.action;
			const cacheKey = getCacheKeyForIndividualPost(postId);

			try {
				const post = await findPostById(postId, { likes: true });
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

				invalidateCacheRemotely(cacheKey);

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
