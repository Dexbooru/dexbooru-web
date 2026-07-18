import { emitUploadProgress } from '$lib/server/events/uploadStatus';
import { deleteBatchFromBucket } from '../../aws/actions/s3';
import { enqueueBatchUploadedPostImages } from '../../aws/actions/sqs';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../../constants/aws';
import { MAXIMUM_DUPLICATES_TO_SEARCH_ON_POST_UPLOAD } from '../../constants/posts';
import { USER_SAFE_UPLOAD_FAILURE_MESSAGE } from '../../constants/upload';
import { createPost, deletePostById, findDuplicatePosts } from '../../db/actions/post';
import { findUserById } from '../../db/actions/user';
import { indexPostImages } from '../../helpers/mlApi';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import logger from '../../logging/logger';
import newPostVectorTargetPublisher, {
	NewPostVectorTargetPublisher,
} from '../../rabbitmq/publishers/newPostVectorTarget';
import { getCacheKeyForPostAuthor, getCacheKeyWithPostCategory } from '../cache-strategies/posts';
import { uploadPostImages } from '../posts/helpers';
import { CreatePostSchema } from '../request-schemas/posts';
import { createCreatePostHandler } from './createCreatePostHandler';
import type { TCreatePostStrategy } from './types';

export const createPostStrategy: TCreatePostStrategy = {
	schema: CreatePostSchema,
	maxDuplicatesToSearch: MAXIMUM_DUPLICATES_TO_SEARCH_ON_POST_UPLOAD,
	requireEmailVerified: true,
	messages: {
		emailUnverified: 'You must verify your email before uploading posts',
		duplicatesDetected: 'Duplicate posts detected',
		success: 'Post created successfully',
		unexpectedError: 'An unexpected error occurred while creating the post',
		pipelineFailureFallback: USER_SAFE_UPLOAD_FAILURE_MESSAGE,
	},
	ensureAuthorCanUpload: async (authorId) => {
		const userWithVerification = await findUserById(authorId, {
			id: true,
			emailVerified: true,
		});
		if (!userWithVerification?.emailVerified) {
			return {
				ok: false,
				reason: 'You must verify your email before uploading posts',
			};
		}
		return { ok: true };
	},
	uploadImages: uploadPostImages,
	findDuplicates: (imageHashes, limit) =>
		findDuplicatePosts(imageHashes, limit, {
			id: true,
			imageUrls: true,
			description: true,
		}),
	deleteUploadedImages: (imageUrls) =>
		deleteBatchFromBucket(AWS_POST_PICTURE_BUCKET_NAME, imageUrls),
	createPost: ({
		sourceLink,
		description,
		isNsfw,
		tags,
		artists,
		imageUrls,
		imageWidths,
		imageHeights,
		imageHashes,
		authorId,
	}) =>
		createPost(
			sourceLink,
			description,
			isNsfw,
			tags,
			artists,
			imageUrls,
			imageWidths,
			imageHeights,
			imageHashes,
			authorId,
		),
	deletePost: deletePostById,
	afterCreate: async ({ post, originalImageUrls, uploadId }) => {
		logger.info('Enqueuing post images for SQS processing...', {
			uploadId,
			postId: post.id,
		});
		enqueueBatchUploadedPostImages(post);

		const authorId = post.author?.id;
		if (authorId) {
			newPostVectorTargetPublisher
				.publish(NewPostVectorTargetPublisher.ROUTING_KEY, {
					id: post.id,
					description: post.description,
					imageUrls: originalImageUrls,
					createdAt: post.createdAt,
					authorId,
				})
				.catch((err) => logger.error('Failed to publish new post vector-target event', err));
		} else {
			logger.warn('Skipping new post vector-target publish: post has no author id', {
				postId: post.id,
			});
		}

		if (uploadId) {
			await emitUploadProgress(uploadId, 'Enqueing post images for classification...');
		}
	},
	onFormActionSuccess: async ({ post, originalImageUrls, authorId }) => {
		void Promise.resolve(indexPostImages(post.id, originalImageUrls)).catch((err) =>
			logger.error('Failed to index post images for ML', err),
		);

		invalidateCacheRemotely(getCacheKeyWithPostCategory('general', 0, 'createdAt', false));
		invalidateCacheRemotely(
			getCacheKeyWithPostCategory('uploaded', 0, 'createdAt', false, authorId),
		);
		invalidateCacheRemotely(
			getCacheKeyForPostAuthor(post.author?.username ?? '', 0, 'createdAt', false),
		);
		invalidateCacheRemotely('pending-posts-0');
	},
	getFormRedirectPath: (postId) => `/posts/${postId}?uploadedSuccessfully=true`,
};

export const handleCreatePost = createCreatePostHandler(createPostStrategy);
