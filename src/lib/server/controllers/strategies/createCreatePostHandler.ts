import { emitUploadFailure, emitUploadProgress } from '$lib/server/events/uploadStatus';
import { ORIGINAL_IMAGE_SUFFIX } from '$lib/shared/constants/images';
import { isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { createPostFormErrorData } from '../posts/helpers';
import type { TCreatePostFormInput, TCreatePostStrategy } from './types';

const isPipelineErrorMessage = (message: string) =>
	message.includes('timed out') ||
	message.includes('processing failed') ||
	message.includes('Please try again');

export function createCreatePostHandler(strategy: TCreatePostStrategy) {
	return async (event: RequestEvent, handlerType: TControllerHandlerVariant) => {
		return await validateAndHandleRequest(
			event,
			handlerType,
			strategy.schema,
			async (data) => {
				const form = data.form as TCreatePostFormInput;
				const {
					description,
					tags,
					artists,
					isNsfw,
					postPictures,
					sourceLink,
					uploadId,
					ignoreDuplicates,
				} = form;
				const errorData = {
					sourceLink,
					description,
					tags,
					artists,
					isNsfw,
				};
				const user = event.locals.user;

				if (strategy.requireEmailVerified) {
					const authorCheck = await strategy.ensureAuthorCanUpload(user.id);
					if (!authorCheck.ok) {
						return createErrorResponse(
							handlerType,
							403,
							authorCheck.reason,
							createPostFormErrorData(errorData, authorCheck.reason),
						);
					}
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
						await strategy.uploadImages(postPictures, isNsfw, uploadId);
					newPostImageUrls = postImageUrls;
					logger.info('Images processed and uploaded successfully', {
						uploadId,
						urls: newPostImageUrls,
					});

					if (uploadId) {
						await emitUploadProgress(uploadId, 'Checking for duplicates...');
					}
					logger.info('Checking for duplicate posts...', { uploadId });
					const duplicatePosts = await strategy.findDuplicates(
						postImageHashes,
						strategy.maxDuplicatesToSearch,
					);

					if (duplicatePosts.length > 0 && !ignoreDuplicates) {
						logger.warn('Duplicate posts detected, aborting upload', {
							uploadId,
							duplicateCount: duplicatePosts.length,
							duplicateIds: duplicatePosts.map((post) => post.id),
						});
						if (newPostImageUrls.length > 0) {
							logger.info('Cleaning up uploaded images due to duplicates', { uploadId });
							void strategy.deleteUploadedImages(newPostImageUrls);
						}
						return createErrorResponse(handlerType, 409, strategy.messages.duplicatesDetected, {
							...errorData,
							duplicatePosts,
						});
					}

					if (uploadId) {
						await emitUploadProgress(uploadId, 'Adding to our collection...');
					}
					logger.info('Creating post in database...', { uploadId });
					const newPost = await strategy.createPost({
						sourceLink,
						description,
						isNsfw,
						tags,
						artists,
						imageUrls: postImageUrls,
						imageWidths: postImageWidths,
						imageHeights: postImageHeights,
						imageHashes: postImageHashes,
						authorId: user.id,
					});
					newPostId = newPost.id;
					logger.info('Post created successfully in database', {
						uploadId,
						postId: newPostId,
					});

					const originalImageUrls = newPost.imageUrls.filter((imageUrl) =>
						imageUrl.includes(ORIGINAL_IMAGE_SUFFIX),
					);

					await strategy.afterCreate({
						post: newPost,
						originalImageUrls,
						uploadId,
					});

					if (handlerType === 'form-action') {
						logger.info('Performing post-upload tasks (indexing, cache invalidation)...', {
							uploadId,
							postId: newPostId,
						});

						await strategy.onFormActionSuccess({
							post: newPost,
							originalImageUrls,
							uploadId,
							authorId: user.id,
						});

						if (uploadId) {
							await emitUploadProgress(uploadId, 'Redirecting to post...');
						}
						logger.info('Post creation complete, redirecting user', {
							uploadId,
							postId: newPostId,
						});
						redirect(302, strategy.getFormRedirectPath(newPost.id));
					}

					return createSuccessResponse(handlerType, strategy.messages.success, { newPost }, 201);
				} catch (error) {
					if (isRedirect(error)) throw error;

					logger.error('Error during post creation', {
						error,
						uploadId,
						postId: newPostId,
						author: user.username,
					});

					if (newPostId) {
						logger.info('Rolling back: deleting failed post from database', {
							postId: newPostId,
						});
						void strategy.deletePost(newPostId);
					}
					if (newPostImageUrls.length > 0) {
						logger.info('Rolling back: deleting uploaded images from S3', {
							urls: newPostImageUrls,
						});
						void strategy.deleteUploadedImages(newPostImageUrls);
					}

					const message =
						error instanceof Error && error.message
							? error.message
							: strategy.messages.unexpectedError;
					const pipelineError = isPipelineErrorMessage(message);
					const userMessage = pipelineError ? message : strategy.messages.unexpectedError;

					if (uploadId) {
						await emitUploadFailure(
							uploadId,
							pipelineError ? userMessage : strategy.messages.pipelineFailureFallback,
						);
					}

					return createErrorResponse(
						handlerType,
						500,
						userMessage,
						createPostFormErrorData(errorData, userMessage),
					);
				}
			},
			true,
		);
	};
}
