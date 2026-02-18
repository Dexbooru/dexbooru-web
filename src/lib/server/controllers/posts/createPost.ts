import { uploadStatusEmitter } from '$lib/server/events/uploadStatus';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { deleteBatchFromBucket } from '../../aws/actions/s3';
import { enqueueBatchUploadedPostImages } from '../../aws/actions/sqs';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../../constants/aws';
import { MAXIMUM_DUPLICATES_TO_SEARCH_ON_POST_UPLOAD } from '../../constants/posts';
import { createPost, deletePostById, findDuplicatePosts } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { indexPostImages } from '../../helpers/mlApi';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { getCacheKeyForPostAuthor, getCacheKeyWithPostCategory } from '../cache-strategies/posts';
import { CreatePostSchema } from '../request-schemas/posts';
import { createPostFormErrorData, uploadPostImages } from './helpers';

export const handleCreatePost = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		CreatePostSchema,
		async (data) => {
			const {
				description,
				tags,
				artists,
				isNsfw,
				postPictures,
				sourceLink,
				uploadId,
				ignoreDuplicates,
			} = data.form;
			const errorData = {
				sourceLink,
				description,
				tags,
				artists,
				isNsfw,
			};
			const user = event.locals.user;

			let newPostId: string | null = null;
			let newPostImageUrls: string[] = [];

			try {
				const { postImageUrls, postImageWidths, postImageHeights, postImageHashes } =
					await uploadPostImages(postPictures, isNsfw, uploadId);
				newPostImageUrls = postImageUrls;

				if (uploadId) {
					uploadStatusEmitter.emit(uploadId, 'Checking for duplicates...');
				}
				const duplicatePosts = await findDuplicatePosts(
					postImageHashes,
					MAXIMUM_DUPLICATES_TO_SEARCH_ON_POST_UPLOAD,
					{
						id: true,
						imageUrls: true,
						description: true,
					},
				);

				if (duplicatePosts.length > 0 && !ignoreDuplicates) {
					if (newPostImageUrls.length > 0) {
						deleteBatchFromBucket(AWS_POST_PICTURE_BUCKET_NAME, newPostImageUrls);
					}
					return createErrorResponse(handlerType, 409, 'Duplicate posts detected', {
						...errorData,
						duplicatePosts,
					});
				}

				if (uploadId) {
					uploadStatusEmitter.emit(uploadId, 'Adding to our collection...');
				}
				const newPost = await createPost(
					sourceLink,
					description,
					isNsfw,
					tags,
					artists,
					postImageUrls,
					postImageWidths,
					postImageHeights,
					postImageHashes,
					user.id,
				);
				newPostId = newPost.id;

				if (newPost) {
					enqueueBatchUploadedPostImages(newPost);

					if (uploadId) {
						uploadStatusEmitter.emit(uploadId, 'Enqueing post images for classification...');
					}
				}

				if (handlerType === 'form-action') {
					indexPostImages(newPost.id, postImageUrls);

					invalidateCacheRemotely(getCacheKeyWithPostCategory('general', 0, 'createdAt', false));
					invalidateCacheRemotely(
						getCacheKeyWithPostCategory('uploaded', 0, 'createdAt', false, event.locals.user.id),
					);
					invalidateCacheRemotely(
						getCacheKeyForPostAuthor(newPost.author?.username ?? '', 0, 'createdAt', false),
					);
					invalidateCacheRemotely('pending-posts-0');

					if (uploadId) {
						uploadStatusEmitter.emit(uploadId, 'Redirecting to post...');
					}
					redirect(302, `/posts/${newPost.id}?uploadedSuccessfully=true`);
				}

				return createSuccessResponse(handlerType, 'Post created successfully', { newPost }, 201);
			} catch (error) {
				if (isRedirect(error)) throw error;

				logger.error(error);

				if (newPostId) {
					deletePostById(newPostId);
				}
				if (newPostImageUrls.length > 0) {
					deleteBatchFromBucket(AWS_POST_PICTURE_BUCKET_NAME, newPostImageUrls);
				}

				if (uploadId) {
					uploadStatusEmitter.emit(uploadId, 'Error occurred during upload.');
				}

				const message = 'An unexpected error occurred while creating the post';
				return createErrorResponse(
					handlerType,
					500,
					message,
					createPostFormErrorData(errorData, message),
				);
			}
		},
		true,
	);
};
