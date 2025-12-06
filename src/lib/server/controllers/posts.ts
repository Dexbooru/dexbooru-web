import { uploadStatusEmitter } from '$lib/server/events/uploadStatus';
import { NULLABLE_USER } from '$lib/shared/constants/auth';
import { MAXIMUM_IMAGES_PER_POST } from '$lib/shared/constants/images';
import { MAXIMUM_POSTS_PER_PAGE } from '$lib/shared/constants/posts';
import type {
	TPost,
	TPostOrderByColumn,
	TPostPaginationData,
	TPostSimilarityBody,
	TPostSimilarityResponse,
} from '$lib/shared/types/posts';
import { isHttpError, isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { deleteBatchFromBucket, uploadBatchToBucket } from '../aws/actions/s3';
import { enqueueBatchUploadedPostImages } from '../aws/actions/sqs';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../constants/aws';
import { PUBLIC_COMMENT_SELECTORS } from '../constants/comments';
import { PAGE_SERVER_LOAD_POST_SELECTORS, PUBLIC_POST_SELECTORS } from '../constants/posts';
import { findPostsByArtistName } from '../db/actions/artist';
import {
	createPost,
	deletePostById,
	findPostById,
	findPostByIdWithUpdatedViewCount,
	findPostsByAuthorId,
	findPostsByPage,
	findSimilarPosts,
	hasUserLikedPost,
	likePostById,
	updatePost,
} from '../db/actions/post';
import { findPostsByTagName } from '../db/actions/tag';
import { findLikedPostsByAuthorId } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import {
	base64ToFile,
	flattenImageBuffers,
	runPostImageTransformationPipelineInBatch,
} from '../helpers/images';
import { getSimilarPostsBySimilaritySearch, indexPostImages } from '../helpers/mlApi';
import {
	cacheMultipleToCollectionRemotely,
	cacheResponseRemotely,
	getRemoteAssociatedKeys,
	getRemoteResponseFromCache,
	invalidateCacheRemotely,
	invalidateMultipleCachesRemotely,
} from '../helpers/sessions';
import logger from '../logging/logger';
import type { TControllerHandlerVariant, TPostFetchCategory } from '../types/controllers';
import {
	CACHE_TIME_ARTIST_POSTS,
	CACHE_TIME_GENERAL_POSTS,
	CACHE_TIME_INDIVIDUAL_POST_FOUND,
	CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND,
	CACHE_TIME_TAG_POSTS,
	getCacheKeyForIndividualPost,
	getCacheKeyForIndividualPostKeys,
	getCacheKeyForPostAuthor,
	getCacheKeyWithPostCategory,
	getCacheKeyWithPostCategoryWithLabel,
} from './cache-strategies/posts';
import {
	CreatePostSchema,
	DeletePostSchema,
	GetPostSchema,
	GetPostsByAuthorSchema,
	GetPostsSchema,
	GetPostsWithArtistNameSchema,
	GetPostsWithTagNameSchema,
	GetSimilarPostsSchema,
	LikePostSchema,
	PostUpdateSchema,
} from './request-schemas/posts';

const throwPostNotFoundError = (handlerType: TControllerHandlerVariant, postId: string) => {
	const errorResponse = createErrorResponse(
		handlerType,
		404,
		`A post with the following id: ${postId} does not exist`,
	);
	if (handlerType === 'page-server-load') throw errorResponse;
	return errorResponse;
};

const uploadPostImages = async (postPictures: File[], isNsfw: boolean, uploadId?: string) => {
	if (uploadId) {
		uploadStatusEmitter.emit(uploadId, 'Processing images...');
	}
	const postImageBufferMaps = await runPostImageTransformationPipelineInBatch(postPictures, isNsfw);
	const {
		fileObjectIds,
		fileBuffers: postImageFileBuffers,
		imageHeights: postImageHeights,
		imageWidths: postImageWidths,
	} = flattenImageBuffers(postImageBufferMaps);

	if (uploadId) {
		uploadStatusEmitter.emit(uploadId, 'Uploading images to server...');
	}
	const postImageUrls = await uploadBatchToBucket(
		AWS_POST_PICTURE_BUCKET_NAME,
		'posts',
		postImageFileBuffers,
		'webp',
		fileObjectIds,
	);

	return {
		postImageUrls,
		postImageHeights,
		postImageWidths,
	};
};

const createPostFormErrorData = (errorData: Record<string, unknown>, message: string) => {
	return {
		...errorData,
		reason: message,
	};
};

export const handleGetSimilarPosts = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetSimilarPostsSchema,
		async (data) => {
			const { imageFile, imageUrl, postId } = data.form;
			const providedFields = [imageFile, imageUrl, postId].filter((field) => field).length;
			if (providedFields !== 1) {
				return createErrorResponse(
					handlerType,
					400,
					'You must provide either an image file, an image url or a post id to get similar posts',
				);
			}

			const requestBody: TPostSimilarityBody = {
				k: 10,
				distance_threshold: 0.35,
			};

			if (postId && postId.length > 0) {
				const post = await findPostById(postId, { imageUrls: true });
				if (!post) {
					return createErrorResponse(
						handlerType,
						404,
						`A post with the id: ${postId} does not exist`,
					);
				}

				requestBody.image_url = post.imageUrls[0];
			} else if (imageUrl && imageUrl.length > 0) {
				requestBody.image_url = imageUrl;
			} else if (imageFile && imageFile.length > 0) {
				const imageFileParts = imageFile.split(',');
				if (imageFileParts.length !== 2) {
					return createErrorResponse(
						handlerType,
						400,
						'The provided image file was not in the correct base64 format',
					);
				}

				requestBody.image_file = imageFileParts[1];
			}

			const response = await getSimilarPostsBySimilaritySearch(requestBody);
			if (!response.ok) {
				return createErrorResponse(handlerType, 500, 'An error occurred while calling the ML api');
			}

			const responseData: TPostSimilarityResponse = await response.json();
			const results = responseData.results;

			return createSuccessResponse(handlerType, 'Successfully fetched similar posts', { results });
		},
		handlerType === 'api-route',
	);
};

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

export const handleGetPostsByAuthor = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetPostsByAuthorSchema,
		async (data) => {
			const { pageNumber, orderBy, ascending } = data.urlSearchParams;
			const { username } = data.pathParams;

			const cacheKey = getCacheKeyForPostAuthor(
				username,
				pageNumber,
				orderBy as TPostOrderByColumn,
				ascending,
			);
			let responseData: TPostPaginationData & { author: string };

			try {
				const cachedData = await getRemoteResponseFromCache<
					TPostPaginationData & { author: string }
				>(cacheKey);
				if (cachedData) {
					responseData = cachedData;
				} else {
					const selectors =
						handlerType === 'page-server-load'
							? PAGE_SERVER_LOAD_POST_SELECTORS
							: PUBLIC_POST_SELECTORS;
					const posts = await findPostsByAuthorId(
						pageNumber,
						MAXIMUM_POSTS_PER_PAGE,
						username,
						orderBy as TPostOrderByColumn,
						ascending,
						selectors,
					);

					posts.forEach((post) => {
						post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
						post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
					});

					responseData = {
						posts,
						pageNumber,
						ascending,
						orderBy: orderBy as TPostOrderByColumn,
						author: username,
					};

					if (handlerType === 'page-server-load') {
						cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_ARTIST_POSTS);
						cacheMultipleToCollectionRemotely(
							posts.map((post) => getCacheKeyForIndividualPostKeys(post.id)),
							cacheKey,
						);
					}
				}

				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the author username of: ${username}`,
					responseData,
				);
			} catch (error) {
				logger.error(error);

				const errorResponse = createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while fetching the author posts',
				);
				if (handlerType === 'page-server-load') throw errorResponse;
				return errorResponse;
			}
		},
	);
};

export const handleCreatePost = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		CreatePostSchema,
		async (data) => {
			const { description, tags, artists, isNsfw, postPictures, sourceLink, uploadId } = data.form;
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
				const { postImageUrls, postImageWidths, postImageHeights } = await uploadPostImages(
					postPictures,
					isNsfw,
					uploadId,
				);
				newPostImageUrls = postImageUrls;

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
						getCacheKeyForPostAuthor(newPost.author?.username ?? '', 0, 'createdAt', false),
					);

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

export const handleGetPost = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetPostSchema, async (data) => {
		const postId = data.pathParams.postId;
		const uploadedSuccessfully = data.urlSearchParams.uploadedSuccessfully === 'true';
		const user = event.locals.user;

		const cacheKey = getCacheKeyForIndividualPost(postId);
		let finalData:
			| TPost
			| {
					post: TPost;
					similarPosts: TPost[];
					similarities?: Record<string, number>;
					uploadedSuccessfully?: boolean;
					hasLikedPost?: boolean;
			  };

		try {
			const cachedData = await getRemoteResponseFromCache<
				| TPost
				| {
						post: TPost;
						similarPosts: TPost[];
						similarities?: Record<string, number>;
						uploadedSuccessfully?: boolean;
						hasLikedPost?: boolean;
				  }
			>(cacheKey);

			if (cachedData) {
				if (cachedData === null) {
					return throwPostNotFoundError(handlerType, postId);
				}

				if ('post' in cachedData && 'similarPosts' in cachedData) {
					finalData = cachedData;
					finalData.uploadedSuccessfully = uploadedSuccessfully;
				} else {
					finalData = cachedData as TPost;
				}
			} else {
				const selectors = {
					...PUBLIC_POST_SELECTORS,
					comments: {
						select: PUBLIC_COMMENT_SELECTORS,
					},
				};
				const similaritySelectors = {
					id: true,
					tagString: true,
					artistString: true,
					imageUrls: true,
				};

				const post =
					handlerType === 'api-route'
						? await findPostById(postId, selectors)
						: await findPostByIdWithUpdatedViewCount(postId, selectors);

				if (!post) {
					cacheResponseRemotely(cacheKey, null, CACHE_TIME_INDIVIDUAL_POST_NOT_FOUND);
					return throwPostNotFoundError(handlerType, postId);
				}

				post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
				post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));

				const { posts: similarPosts, similarities } = await findSimilarPosts(
					post.id,
					post.tagString,
					post.artistString,
					similaritySelectors,
				);
				similarPosts.forEach((similarPost) => {
					similarPost.tags = similarPost.tagString.split(',').map((tag) => ({ name: tag }));
					similarPost.artists = similarPost.artistString
						.split(',')
						.map((artist) => ({ name: artist }));
				});

				const hasLikedPost =
					user.id !== NULLABLE_USER.id ? await hasUserLikedPost(user.id, post.id) : false;

				finalData =
					handlerType === 'api-route'
						? post
						: { post, similarPosts, similarities, uploadedSuccessfully, hasLikedPost };

				cacheResponseRemotely(cacheKey, finalData, CACHE_TIME_INDIVIDUAL_POST_FOUND);
			}

			return createSuccessResponse(
				handlerType,
				`Successfully fetched post with id: ${postId}`,
				finalData,
			);
		} catch (error) {
			if (isHttpError(error)) throw error;

			logger.error(error);

			const errorResponse = createErrorResponse(
				handlerType,
				500,
				'An error occurred while fetching the post',
			);
			if (handlerType === 'page-server-load') throw errorResponse;

			return errorResponse;
		}
	});
};

export const handleGetPostsWithArtistName = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetPostsWithArtistNameSchema,
		async (data) => {
			const artistName = data.pathParams.name;
			const { ascending, orderBy, pageNumber } = data.urlSearchParams;
			const selectors =
				handlerType === 'page-server-load'
					? PAGE_SERVER_LOAD_POST_SELECTORS
					: PUBLIC_POST_SELECTORS;

			let responseData: TPostPaginationData;
			const cacheKey = getCacheKeyWithPostCategoryWithLabel(
				'artist',
				artistName,
				pageNumber,
				orderBy,
				ascending,
			);

			try {
				const cachedData = await getRemoteResponseFromCache<TPostPaginationData>(cacheKey);
				if (cachedData) {
					responseData = cachedData;
				} else {
					const posts = await findPostsByArtistName(
						artistName,
						pageNumber,
						MAXIMUM_POSTS_PER_PAGE,
						orderBy as TPostOrderByColumn,
						ascending,
						selectors,
					);

					posts.forEach((post) => {
						post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
						post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
					});

					responseData = {
						posts,
						pageNumber,
						ascending,
						orderBy: orderBy as TPostOrderByColumn,
					};

					cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_ARTIST_POSTS);
					cacheMultipleToCollectionRemotely(
						posts.map((post) => getCacheKeyForIndividualPostKeys(post.id)),
						cacheKey,
					);
				}

				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the artist name of: ${artistName}`,
					responseData,
				);
			} catch (error) {
				logger.error(error);

				const errorResponse = createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while fetching the posts with artists with a certain name',
				);

				if (handlerType === 'page-server-load') {
					throw errorResponse;
				}

				return errorResponse;
			}
		},
	);
};

export const handleGetPostsWithTagName = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetPostsWithTagNameSchema,
		async (data) => {
			const tagName = data.pathParams.name;
			const { ascending, orderBy, pageNumber } = data.urlSearchParams;
			const selectors =
				handlerType === 'page-server-load'
					? PAGE_SERVER_LOAD_POST_SELECTORS
					: PUBLIC_POST_SELECTORS;

			let responseData: TPostPaginationData;
			const cacheKey = getCacheKeyWithPostCategoryWithLabel(
				'tag',
				tagName,
				pageNumber,
				orderBy,
				ascending,
			);

			try {
				const cachedData = await getRemoteResponseFromCache<TPostPaginationData>(cacheKey);
				if (cachedData) {
					responseData = cachedData;
				} else {
					const posts = await findPostsByTagName(
						tagName,
						pageNumber,
						MAXIMUM_POSTS_PER_PAGE,
						orderBy as TPostOrderByColumn,
						ascending,
						selectors,
					);

					posts.forEach((post) => {
						post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
						post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
					});

					responseData = {
						posts,
						pageNumber,
						ascending,
						orderBy: orderBy as TPostOrderByColumn,
					};

					cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_TAG_POSTS);
					cacheMultipleToCollectionRemotely(
						posts.map((post) => getCacheKeyForIndividualPostKeys(post.id)),
						cacheKey,
					);
				}

				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the artist name of: ${tagName}`,
					responseData,
				);
			} catch (error) {
				logger.error(error);

				const errorResponse = createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while fetching the posts with tags with a certain name',
				);
				if (handlerType === 'page-server-load') {
					throw errorResponse;
				}

				return errorResponse;
			}
		},
	);
};

export const handleGetPosts = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
	overrideCategory?: TPostFetchCategory,
) => {
	return await validateAndHandleRequest(event, handlerType, GetPostsSchema, async (data) => {
		const category = overrideCategory ?? data.urlSearchParams.category;
		const { ascending, orderBy, pageNumber, userId } = data.urlSearchParams;
		const user = event.locals.user;

		if (user.id === NULLABLE_USER.id && ['uploaded', 'liked'].includes(category)) {
			redirect(302, '/');
		}

		const cacheKey = getCacheKeyWithPostCategory(
			category,
			pageNumber,
			orderBy as TPostOrderByColumn,
			ascending,
		);

		try {
			let responseData: TPostPaginationData;
			const cachedData = await getRemoteResponseFromCache<TPostPaginationData>(cacheKey);

			if (cachedData) {
				responseData = cachedData;
			} else {
				const selectors =
					handlerType === 'page-server-load'
						? PAGE_SERVER_LOAD_POST_SELECTORS
						: PUBLIC_POST_SELECTORS;

				let posts: TPost[] = [];
				switch (category) {
					case 'general':
						posts = await findPostsByPage(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							orderBy as TPostOrderByColumn,
							ascending,
							selectors,
						);
						break;
					case 'liked':
						posts = await findLikedPostsByAuthorId(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							user.id,
							orderBy as TPostOrderByColumn,
							ascending,
							selectors,
						);
						break;
					case 'uploaded':
						posts = await findPostsByAuthorId(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							userId ?? user.id,
							orderBy as TPostOrderByColumn,
							ascending,
							selectors,
						);
						break;
				}

				posts.forEach((post) => {
					post.tags = post.tagString.split(',').map((tag) => ({ name: tag }));
					post.artists = post.artistString.split(',').map((artist) => ({ name: artist }));
				});

				responseData = {
					posts,
					pageNumber,
					ascending,
					orderBy,
				};

				cacheResponseRemotely(cacheKey, responseData, CACHE_TIME_GENERAL_POSTS);
				cacheMultipleToCollectionRemotely(
					posts.map((post) => getCacheKeyForIndividualPostKeys(post.id)),
					cacheKey,
				);
			}

			return createSuccessResponse(
				handlerType,
				'Successfully fetched paginated posts',
				responseData,
			);
		} catch (error) {
			logger.error(error);

			const errorResponse = createErrorResponse(
				handlerType,
				500,
				'An unexpected error occurred while fetching the posts',
			);
			if (handlerType === 'page-server-load') {
				throw errorResponse;
			}

			return errorResponse;
		}
	});
};

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
