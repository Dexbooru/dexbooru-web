import { findPostById, deletePostById } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { deleteBatchFromBucket } from '../../aws/actions/s3';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../../constants/aws';
import {
	getRemoteAssociatedKeys,
	invalidateCacheRemotely,
	invalidateMultipleCachesRemotely,
} from '../../helpers/sessions';
import {
	getCacheKeyForIndividualPost,
	getCacheKeyForIndividualPostKeys,
} from '../cache-strategies/posts';
import { DeletePostSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

export const handleDeletePost = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeletePostSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const cacheKey = getCacheKeyForIndividualPost(postId);
			const associatedCacheKey = getCacheKeyForIndividualPostKeys(postId);

			try {
				const post = await findPostById(postId, {
					id: true,
					imageUrls: true,
					author: {
						select: {
							id: true,
							role: true,
						},
					},
				});
				if (!post) {
					return createErrorResponse(
						'api-route',
						404,
						`A post with the following id: ${postId} does not exist`,
					);
				}

				if (event.locals.user.id !== post.author.id && post.author.role !== 'OWNER') {
					return createErrorResponse(
						'api-route',
						403,
						'You are not authorized to delete this post, as you are not the author or a site owner',
					);
				}

				await deletePostById(postId);

				if (post.imageUrls.length > 0) {
					deleteBatchFromBucket(AWS_POST_PICTURE_BUCKET_NAME, post.imageUrls);
				}

				invalidateCacheRemotely(cacheKey);

				const associatedCacheKeys = await getRemoteAssociatedKeys(associatedCacheKey);
				invalidateMultipleCachesRemotely(associatedCacheKeys);

				invalidateCacheRemotely(associatedCacheKey);

				return createSuccessResponse(
					'api-route',
					`A post with the id: ${postId} and its corresponding comments and images were deleted successfully!`,
					post,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse('api-route', 500, 'An error occurred while deleting the post');
			}
		},
		true,
	);
};
