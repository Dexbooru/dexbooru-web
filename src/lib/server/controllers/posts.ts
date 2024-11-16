import { NULLABLE_USER } from '$lib/shared/constants/auth';
import {
	MAXIMUM_IMAGES_PER_POST,
	MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB,
} from '$lib/shared/constants/images';
import {
	MAXIMUM_ARTISTS_PER_POST,
	MAXIMUM_POSTS_PER_PAGE,
	MAXIMUM_TAGS_PER_POST,
} from '$lib/shared/constants/posts';
import { isFileImage, isFileImageSmall } from '$lib/shared/helpers/images';
import { isLabelAppropriate, transformLabels } from '$lib/shared/helpers/labels';
import type {
	TPost,
	TPostOrderByColumn,
	TPostSimilarityBody,
	TPostSimilarityResponse,
} from '$lib/shared/types/posts';
import { isHttpError, isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { deleteBatchFromBucket, uploadBatchToBucket } from '../aws/actions/s3';
import { AWS_POST_PICTURE_BUCKET_NAME } from '../constants/aws';
import { PUBLIC_POST_SELECTORS } from '../constants/posts';
import { boolStrSchema, pageNumberSchema } from '../constants/reusableSchemas';
import { findPostsByArtistName } from '../db/actions/artist';
import {
	createPost,
	deletePostById,
	findPostById,
	findPostByIdWithUpdatedViewCount,
	findPostsByAuthorId,
	findPostsByPage,
	getTotalPostCount,
	hasUserLikedPost,
	likePostById,
	updatePost,
} from '../db/actions/post';
import { findPostsByTagName } from '../db/actions/tag';
import { findLikedPostsByAuthorId, findLikedPostsFromSubset } from '../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import { flattenImageBuffers, runPostImageTransformationPipelineInBatch } from '../helpers/images';
import { getSimilarPostsBySimilaritySearch, indexPostImages } from '../helpers/mlApi';
import type {
	TControllerHandlerVariant,
	TPostFetchCategory,
	TRequestSchema,
} from '../types/controllers';

const postPaginationSchema = z.object({
	category: z
		.union([z.literal('general'), z.literal('liked'), z.literal('uploaded')])
		.default('general'),
	ascending: boolStrSchema,
	orderBy: z
		.union([
			z.literal('views'),
			z.literal('likes'),
			z.literal('createdAt'),
			z.literal('updatedAt'),
			z.literal('commentCount'),
		])
		.default('createdAt'),
	pageNumber: pageNumberSchema,
});

const descriptionSchema = z
	.string()
	.min(1, 'The description must be at least a single character long')
	.refine((val) => isLabelAppropriate(val, 'postDescription'), {
		message: 'The provided description was not appropriate',
	});

const GetPostsByAuthorSchema = {
	pathParams: z.object({
		username: z.string(),
	}),
	urlSearchParams: postPaginationSchema,
} satisfies TRequestSchema;

const GetPostSelectors = {
	...PUBLIC_POST_SELECTORS,
	imageWidths: true,
	imageHeights: true,
};
const GetPostSchema = {
	urlSearchParams: z.object({
		uploadedSuccessfully: z.string().optional(),
	}),
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const GetPostsSchema = {
	urlSearchParams: z
		.object({
			userId: z.string().uuid().optional(),
		})
		.merge(postPaginationSchema),
} satisfies TRequestSchema;

const DeletePostSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const LikePostSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		action: z.union([z.literal('like'), z.literal('dislike')]),
	}),
} satisfies TRequestSchema;

const GetPostsWithTagNameSchema = {
	pathParams: z.object({
		name: z.string().min(1, 'The tag name needs to be least one character long'),
	}),
	urlSearchParams: postPaginationSchema,
} satisfies TRequestSchema;

const GetPostsWithArtistNameSchema = {
	pathParams: z.object({
		name: z.string().min(1, 'The tag name needs to be least one character long'),
	}),
	urlSearchParams: postPaginationSchema,
} satisfies TRequestSchema;

const CreatePostSchema = {
	form: z.object({
		description: descriptionSchema,
		postPictures: z
			.union([z.instanceof(globalThis.File), z.array(z.instanceof(globalThis.File))])
			.transform((val) => Array.from(val instanceof File ? [val] : val))
			.refine(
				(val) => {
					if (val.length > MAXIMUM_IMAGES_PER_POST) return false;
					return !val.some((file) => !isFileImage(file) || !isFileImageSmall(file, 'post'));
				},
				{
					message: `At least one of the uploaded post picture was not an image format, exceeded the maximum size of ${MAXIMUM_POST_IMAGE_UPLOAD_SIZE_MB} or the total number of images exceeded the maximum allowed size per post of ${MAXIMUM_IMAGES_PER_POST}`,
				},
			),
		isNsfw: boolStrSchema,
		tags: z
			.string()
			.min(1, 'The comma-seperated tag string must be at least a single character long')
			.transform((val) => {
				return transformLabels(val.split(','));
			})
			.refine(
				(val) => {
					if (val.length > MAXIMUM_TAGS_PER_POST) return false;
					return !val.some((tag) => !isLabelAppropriate(tag, 'tag'));
				},
				{
					message:
						'At least one of the providedd tags did not meet requirements and was not appropriate',
				},
			),
		artists: z
			.string()
			.min(1, 'The comma-seperated artist string must be at least a single character long')
			.transform((val) => {
				return transformLabels(val.split(','));
			})
			.refine(
				(val) => {
					if (val.length > MAXIMUM_ARTISTS_PER_POST) return false;
					return !val.some((artist) => !isLabelAppropriate(artist, 'artist'));
				},
				{
					message:
						'At least one of the providedd artists did not meet requirements and was not appropriate',
				},
			),
	}),
} satisfies TRequestSchema;

const GetSimilarPostsSchema = {
	form: z.object({
		postId: z.string().uuid().optional(),
		imageUrl: z.string().url().optional(),
		imageFile: z.string().optional(),
	}),
} satisfies TRequestSchema;

const PostUpdateSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		description: descriptionSchema.optional(),
	}),
} satisfies TRequestSchema;

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
				distance_threshold: 0.45,
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

export const handleUpdatePost = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		PostUpdateSchema,
		async (data) => {
			const { postId } = data.pathParams;

			try {
				const currentPost = await findPostById(postId, { authorId: true });
				if (!currentPost) {
					return createErrorResponse(
						handlerType,
						404,
						`A post with the id: ${postId} does not exist`,
					);
				}

				if (event.locals.user.id !== currentPost.authorId) {
					return createErrorResponse(
						handlerType,
						403,
						`The currently authenticated user id does not match the post's author id: ${currentPost.authorId}`,
					);
				}

				const updatedPost = await updatePost(postId, data.body);
				return createSuccessResponse(
					handlerType,
					`Successfully updated the post with id: ${postId}`,
					updatedPost,
				);
			} catch {
				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occured while trying to update the post',
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

			try {
				const posts =
					(await findPostsByAuthorId(
						pageNumber,
						MAXIMUM_POSTS_PER_PAGE,
						username,
						orderBy as TPostOrderByColumn,
						ascending,
						PUBLIC_POST_SELECTORS,
					)) ?? [];

				const likedPosts =
					event.locals.user.id !== NULLABLE_USER.id && handlerType !== 'api-route'
						? await findLikedPostsFromSubset(event.locals.user.id, posts)
						: [];
				const responseData = {
					posts,
					...(handlerType !== 'api-route' && { likedPosts }),
					pageNumber,
					ascending,
					orderBy: orderBy as TPostOrderByColumn,
					author: username,
				};
				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the author username of: ${username}`,
					responseData,
				);
			} catch {
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
			const { description, tags, artists, isNsfw, postPictures } = data.form;
			const errorData = {
				description,
				tags,
				artists,
				isNsfw,
			};

			try {
				const postImageBufferMaps = await runPostImageTransformationPipelineInBatch(
					postPictures,
					isNsfw,
				);
				const {
					fileObjectIds,
					fileBuffers: postImageFileBuffers,
					imageHeights: postImageHeights,
					imageWidths: postImageWidths,
				} = flattenImageBuffers(postImageBufferMaps);
				const postImageUrls = await uploadBatchToBucket(
					AWS_POST_PICTURE_BUCKET_NAME,
					'posts',
					postImageFileBuffers,
					'webp',
					fileObjectIds,
				);

				const newPost = await createPost(
					description,
					isNsfw,
					tags,
					artists,
					postImageUrls,
					postImageWidths,
					postImageHeights,
					event.locals.user.id,
				);

				indexPostImages(newPost.id, postImageUrls);

				if (handlerType === 'form-action') {
					redirect(302, `/posts/${newPost.id}?uploadedSuccessfully=true`);
				}

				return createSuccessResponse(handlerType, 'Post created successfully', { newPost }, 201);
			} catch (error) {
				if (isRedirect(error)) throw error;
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
		const user = event.locals.user;

		try {
			const post =
				handlerType === 'api-route'
					? await findPostById(postId, GetPostSelectors)
					: await findPostByIdWithUpdatedViewCount(postId, GetPostSelectors);
			if (!post) {
				const error = createErrorResponse(handlerType, 404, `Post with id ${postId} not found`);
				if (handlerType === 'page-server-load') {
					throw error;
				}
				return error;
			}

			const hasLikedPost =
				user.id !== NULLABLE_USER.id ? await hasUserLikedPost(user.id, post.id) : false;
			const uploadedSuccessfully = data.urlSearchParams.uploadedSuccessfully;
			const finalData =
				handlerType === 'api-route'
					? post
					: { post, uploadedSuccessfully: uploadedSuccessfully === 'true', hasLikedPost };
			return createSuccessResponse(
				handlerType,
				`Successfully fetched post with id: ${postId}`,
				finalData,
			);
		} catch (error) {
			if (isHttpError(error)) throw error;
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
			const user = event.locals.user;
			const artistName = data.pathParams.name;
			const { ascending, orderBy, pageNumber } = data.urlSearchParams;

			try {
				const posts = await findPostsByArtistName(
					artistName,
					pageNumber,
					MAXIMUM_POSTS_PER_PAGE,
					orderBy as TPostOrderByColumn,
					ascending,
					PUBLIC_POST_SELECTORS,
				);
				const likedPosts =
					user.id !== NULLABLE_USER.id && handlerType !== 'api-route'
						? await findLikedPostsFromSubset(user.id, posts)
						: [];

				const responseData = {
					posts,
					...(handlerType !== 'api-route' && { likedPosts }),
					pageNumber,
					ascending,
					orderBy: orderBy as TPostOrderByColumn,
				};
				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the artist name of: ${artistName}`,
					responseData,
				);
			} catch (error) {
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
			const user = event.locals.user;
			const tagName = data.pathParams.name;
			const { ascending, orderBy, pageNumber } = data.urlSearchParams;

			try {
				const posts = await findPostsByTagName(
					tagName,
					pageNumber,
					MAXIMUM_POSTS_PER_PAGE,
					orderBy as TPostOrderByColumn,
					ascending,
					PUBLIC_POST_SELECTORS,
				);
				const likedPosts =
					user.id !== NULLABLE_USER.id && handlerType !== 'api-route'
						? await findLikedPostsFromSubset(user.id, posts)
						: [];

				const responseData = {
					posts,
					...(handlerType !== 'api-route' && { likedPosts }),
					pageNumber,
					ascending,
					orderBy: orderBy as TPostOrderByColumn,
				};
				return createSuccessResponse(
					handlerType,
					`Successfully fetched the posts with the artist name of: ${tagName}`,
					responseData,
				);
			} catch (error) {
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

		if (user.id === NULLABLE_USER.id && category === 'liked') {
			const errorResponse = createErrorResponse(
				handlerType,
				401,
				'Cannot fetch liked posts of unauthenticated user',
			);
			if (handlerType === 'page-server-load') {
				throw errorResponse;
			}
		}

		try {
			let posts: TPost[] = [];
			switch (category) {
				case 'general':
					posts = await findPostsByPage(
						pageNumber,
						MAXIMUM_POSTS_PER_PAGE,
						orderBy as TPostOrderByColumn,
						ascending,
						PUBLIC_POST_SELECTORS,
					);
					break;
				case 'liked':
					posts =
						(await findLikedPostsByAuthorId(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							user.id,
							orderBy as TPostOrderByColumn,
							ascending,
							PUBLIC_POST_SELECTORS,
						)) ?? [];
					break;
				case 'uploaded':
					posts =
						(await findPostsByAuthorId(
							pageNumber,
							MAXIMUM_POSTS_PER_PAGE,
							userId ?? user.id,
							orderBy as TPostOrderByColumn,
							ascending,
							PUBLIC_POST_SELECTORS,
						)) ?? [];
					break;
			}

			if (handlerType === 'api-route') {
				const responseData = {
					posts,
					pageNumber,
					ascending,
					orderBy,
				};
				return createSuccessResponse(
					handlerType,
					'Successfully fetched paginated posts',
					responseData,
				);
			}

			const likedPosts =
				user.id !== NULLABLE_USER.id && category !== 'liked'
					? await findLikedPostsFromSubset(user.id, posts)
					: posts;
			const responseData = {
				posts,
				likedPosts: user.id !== NULLABLE_USER.id ? likedPosts : [],
				pageNumber,
				ascending,
				orderBy,
				postCount: await getTotalPostCount(),
			};

			return createSuccessResponse(
				handlerType,
				'Successfully fetched paginated posts',
				responseData,
			);
		} catch (error) {
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

			try {
				const post = await findPostById(postId, PUBLIC_POST_SELECTORS);
				if (!post) {
					return createErrorResponse(
						'api-route',
						404,
						`A post with the following id: ${postId} does not exist`,
					);
				}

				if (event.locals.user.id !== post.author.id) {
					return createErrorResponse(
						'api-route',
						403,
						'You are not authorized to delete this post, as you are not the author',
					);
				}

				await deletePostById(postId, event.locals.user.id);

				if (post.imageUrls.length > 0) {
					await deleteBatchFromBucket(AWS_POST_PICTURE_BUCKET_NAME, post.imageUrls);
				}

				const successMessage = `A post with the id: ${postId} and its corresponding comments and images were deleted successfully!`;
				return createSuccessResponse('api-route', successMessage, post);
			} catch (error) {
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

				return createSuccessResponse(
					'api-route',
					`The post with the id: ${postId} was successfully ${
						action === 'like' ? 'liked' : 'disliked'
					}`,
				);
			} catch (error) {
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
