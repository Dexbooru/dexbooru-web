import { uploadStatusEmitter } from '$lib/server/events/uploadStatus';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { deleteBatchFromBucket } from '../../aws/actions/s3';
import { enqueueBatchUploadedPostImages } from '../../aws/actions/sqs';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../../constants/aws';
import { MAXIMUM_DUPLICATES_TO_SEARCH_ON_POST_UPLOAD } from '../../constants/posts';
import { createPost, deletePostById, findDuplicatePosts } from '../../db/actions/post';
import { findUserById } from '../../db/actions/user';
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

			const userWithVerification = await findUserById(user.id, {
				id: true,
				emailVerified: true,
			});
			if (!userWithVerification?.emailVerified) {
				return createErrorResponse(
					handlerType,
					403,
					'You must verify your email before uploading posts',
					createPostFormErrorData(errorData, 'You must verify your email before uploading posts'),
				);
			}

			logger.info('Starting post creation process', {
				author: user.username,
				authorId: user.id,
				imageCount: postPictures.length,
				isNsfw,
				uploadId,
			});

			let newPostId: string | null = null;
			let newPostImageUrls: string[] = [];

			try {
				logger.info('Processing and uploading post images...', { uploadId });
				const { postImageUrls, postImageWidths, postImageHeights, postImageHashes } =
					await uploadPostImages(postPictures, isNsfw, uploadId);
				newPostImageUrls = postImageUrls;
				logger.info('Images processed and uploaded successfully', {
					uploadId,
					urls: newPostImageUrls,
				});

				if (uploadId) {
					uploadStatusEmitter.emit(uploadId, 'Checking for duplicates...');
				}
				logger.info('Checking for duplicate posts...', { uploadId });
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
					logger.warn('Duplicate posts detected, aborting upload', {
						uploadId,
						duplicateCount: duplicatePosts.length,
						duplicateIds: duplicatePosts.map((p) => p.id),
					});
					if (newPostImageUrls.length > 0) {
						logger.info('Cleaning up uploaded images due to duplicates', { uploadId });
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
				logger.info('Creating post in database...', { uploadId });
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
				logger.info('Post created successfully in database', {
					uploadId,
					postId: newPostId,
				});

				if (newPost) {
					logger.info('Enqueuing post images for SQS processing...', {
						uploadId,
						postId: newPostId,
					});
					enqueueBatchUploadedPostImages(newPost);

					if (uploadId) {
						uploadStatusEmitter.emit(uploadId, 'Enqueing post images for classification...');
					}
				}

				if (handlerType === 'form-action') {
					logger.info('Performing post-upload tasks (indexing, cache invalidation)...', {
						uploadId,
						postId: newPostId,
					});
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
					logger.info('Post creation complete, redirecting user', { uploadId, postId: newPostId });
					redirect(302, `/posts/${newPost.id}?uploadedSuccessfully=true`);
				}

				return createSuccessResponse(handlerType, 'Post created successfully', { newPost }, 201);
			} catch (error) {
				if (isRedirect(error)) throw error;

				logger.error('Error during post creation', {
					error,
					uploadId,
					postId: newPostId,
					author: user.username,
				});

				if (newPostId) {
					logger.info('Rolling back: deleting failed post from database', { postId: newPostId });
					deletePostById(newPostId);
				}
				if (newPostImageUrls.length > 0) {
					logger.info('Rolling back: deleting uploaded images from S3', {
						urls: newPostImageUrls,
					});
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
