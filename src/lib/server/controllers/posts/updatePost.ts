import { findPostById, updatePost } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { deleteBatchFromBucket } from '../../aws/actions/s3';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../../constants/aws';
import { MAXIMUM_IMAGES_PER_POST } from '$lib/shared/constants/images';
import { base64ToFile } from '../../helpers/images';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import { getCacheKeyForIndividualPost } from '../cache-strategies/posts';
import { PostUpdateSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';
import { uploadPostImages } from './helpers';

export const handleUpdatePost = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		PostUpdateSchema,
		async (data) => {
			const { postId } = data.pathParams;
			const { description, newPostImagesContent = [], deletionPostImageUrls = [] } = data.body;
			const user = event.locals.user;

			const cacheKey = getCacheKeyForIndividualPost(postId);

			try {
				const currentPost = await findPostById(postId, {
					authorId: true,
					isNsfw: true,
					imageUrls: true,
					imageWidths: true,
					imageHeights: true,
				});
				if (!currentPost) {
					return createErrorResponse(
						'api-route',
						404,
						`A post with the id: ${postId} does not exist`,
					);
				}

				if (user.id !== currentPost.authorId) {
					return createErrorResponse(
						'api-route',
						403,
						`The currently authenticated user id does not match the post's author id: ${currentPost.authorId}`,
					);
				}

				let totalImagesInPost = currentPost.imageUrls.length;
				let {
					imageUrls: finalPostImageUrls,
					imageHeights: finalPostImageHeights,
					imageWidths: finalPostImageWidths,
				} = currentPost;

				if (deletionPostImageUrls.length > 0) {
					const deletionResponses = await deleteBatchFromBucket(
						AWS_POST_PICTURE_BUCKET_NAME,
						deletionPostImageUrls,
					);
					const successfullyDeleted = deletionPostImageUrls.filter(
						(_, index) => deletionResponses[index]?.$metadata.httpStatusCode === 204,
					);

					const deletionSet = new Set(successfullyDeleted);
					finalPostImageUrls = finalPostImageUrls.filter((url) => !deletionSet.has(url));
					finalPostImageHeights = finalPostImageHeights.filter(
						(_, index) => index < finalPostImageUrls.length,
					);
					finalPostImageWidths = finalPostImageWidths.filter(
						(_, index) => index < finalPostImageUrls.length,
					);

					totalImagesInPost = finalPostImageUrls.length;
				}

				if (newPostImagesContent.length > 0) {
					if (totalImagesInPost + newPostImagesContent.length > MAXIMUM_IMAGES_PER_POST) {
						return createErrorResponse(
							'api-route',
							400,
							`The total number of images in the post exceeds the maximum allowed size of ${MAXIMUM_IMAGES_PER_POST}`,
						);
					}

					const postImageFiles = newPostImagesContent.map((base64String, index) =>
						base64ToFile(base64String, `${currentPost.id}-${index}.webp`),
					);
					const { postImageUrls, postImageHeights, postImageWidths } = await uploadPostImages(
						postImageFiles,
						currentPost.isNsfw,
					);

					finalPostImageUrls = [...finalPostImageUrls, ...postImageUrls];
					finalPostImageHeights = [...finalPostImageHeights, ...postImageHeights];
					finalPostImageWidths = [...finalPostImageWidths, ...postImageWidths];
				}

				if (
					description !== currentPost.description ||
					finalPostImageUrls !== currentPost.imageUrls
				) {
					const updatedPost = await updatePost(postId, {
						description,
						imageUrls: finalPostImageUrls,
						imageHeights: finalPostImageHeights,
						imageWidths: finalPostImageWidths,
					});
					return createSuccessResponse(
						'api-route',
						`Successfully updated the post with id: ${postId}`,
						updatedPost,
					);
				}

				invalidateCacheRemotely(cacheKey);

				return createSuccessResponse(
					'api-route',
					`No changes were made to the post with id: ${postId}`,
					currentPost,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while trying to update the post',
				);
			}
		},
		true,
	);
};
