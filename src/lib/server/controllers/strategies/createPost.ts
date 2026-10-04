import { emitUploadProgress } from '$lib/server/events/uploadStatus';
import { pickSauceNaoPostSource, resolvePostSource } from '$lib/shared/helpers/sauceNao';
import type { TPostSourceFields, TPostSourceOverrides } from '$lib/shared/types/sauceNao';
import { deleteBatchFromBucket } from '../../aws/actions/s3';
import { enqueueBatchUploadedPostImages } from '../../aws/actions/sqs';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../../constants/aws';
import { MAXIMUM_DUPLICATES_TO_SEARCH_ON_POST_UPLOAD } from '../../constants/posts';
import { USER_SAFE_UPLOAD_FAILURE_MESSAGE } from '../../constants/upload';
import { createPost, deletePostById, findDuplicatePosts } from '../../db/actions/post';
import { createPostSource } from '../../db/actions/postSource';
import { findUserById } from '../../db/actions/user';
import { indexPostImages } from '../../helpers/mlApi';
import { readCachedSauceNaoMatches } from '../../helpers/sauceNao';
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

const CLASSIFICATION_QUEUE_PROGRESS = 'Enqueing post images for classification...';
const KNOWN_SOURCE_PROGRESS = 'Saving post source...';

const detectCachedPostSource = async (postPictures: File[]): Promise<TPostSourceFields | null> => {
	for (const file of postPictures) {
		const matches = await readCachedSauceNaoMatches(new Uint8Array(await file.arrayBuffer()));
		const picked = pickSauceNaoPostSource(matches);
		if (picked) return picked;
	}
	return null;
};

const saveKnownPostSource = async (
	postId: string,
	overrides: TPostSourceOverrides,
	postPictures: File[],
): Promise<TPostSourceFields | null> => {
	const detected =
		overrides.characterName && overrides.sourceTitle && overrides.sourceType
			? null
			: await detectCachedPostSource(postPictures);
	const resolution = resolvePostSource(overrides, detected);
	if (resolution.status !== 'known') return null;
	await createPostSource(
		postId,
		resolution.characterName,
		resolution.sourceTitle,
		resolution.sourceType,
	);
	return resolution;
};

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
	afterCreate: async ({ post, originalImageUrls, uploadId, overrides, postPictures }) => {
		let knownSource: TPostSourceFields | null = null;
		try {
			knownSource = await saveKnownPostSource(post.id, overrides, postPictures);
		} catch (error) {
			logger.error(
				'Failed to resolve the post source. Falling back to the classification queue.',
				error,
			);
		}

		if (knownSource) {
			logger.info('Post source is known, skipping the classification queue', {
				uploadId,
				postId: post.id,
				characterName: knownSource.characterName,
				sourceTitle: knownSource.sourceTitle,
				sourceType: knownSource.sourceType,
			});
		} else {
			logger.info('Enqueuing post images for SQS processing...', {
				uploadId,
				postId: post.id,
			});
			enqueueBatchUploadedPostImages(post);
		}

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
			await emitUploadProgress(
				uploadId,
				knownSource ? KNOWN_SOURCE_PROGRESS : CLASSIFICATION_QUEUE_PROGRESS,
			);
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
