import { NULLABLE_USER } from "$lib/shared/constants/auth";
import { MAXIMUM_IMAGES_PER_POST } from "$lib/shared/constants/images";
import { POST_PICTURE_FORM_FIELD } from "$lib/shared/constants/posts";
import { getFormFields } from "$lib/shared/helpers/forms";
import { isFileImage, isFileImageSmall } from "$lib/shared/helpers/images";
import { isArtistValid, isTagValid, isValidDescription, transformLabels } from "$lib/shared/helpers/labels";
import type { TPost, TPostOrderByColumn } from "$lib/shared/types/posts";
import type { IUploadFormFields } from "$lib/shared/types/upload";
import { redirect, type RequestEvent } from "@sveltejs/kit";
import { z } from "zod";
import { deleteBatchFromBucket, uploadBatchToBucket } from "../aws/actions/s3";
import { AWS_POST_PICTURE_BUCKET_NAME } from "../constants/aws";
import { MAXIMUM_POSTS_PER_PAGE, PUBLIC_POST_SELECTORS } from "../constants/posts";
import { SINGLE_POST_CACHE_TIME_SECONDS } from "../constants/sessions";
import { findPostsByArtistName } from "../db/actions/artist";
import { createPost, deletePostById, findPostById, findPostByIdWithUpdatedViewCount, findPostsByAuthorId, findPostsByPage, likePostById } from "../db/actions/post";
import { findPostsByTagName } from "../db/actions/tag";
import { findLikedPostsByAuthorId, findLikedPostsFromSubset } from "../db/actions/user";
import { createErrorResponse, createSuccessResponse, validateAndHandleRequest } from "../helpers/controllers";
import { runPostImageTransformationPipelineInBatch } from "../helpers/images";
import { cacheResponse } from "../helpers/sessions";
import type { TControllerHandlerVariant, TPostFetchCategory, TRequestSchema } from "../types/controllers";

const GetPostSchema = {
    urlSearchParams: z.object({
        uploadedSuccessfully: z.string().optional(),
    }),
    pathParams: z.object({
        postId: z.string().uuid(),
    })
} satisfies TRequestSchema;

const GetPostsSchema = {
    urlSearchParams: z.object({
        userId: z.string().uuid().optional(),
        category: z.union([z.literal('general'), z.literal('liked'), z.literal('uploaded')]).default('general'),
        ascending: z.union([z.literal('true'), z.literal('false')]).optional().default('false').transform(val => val === 'true' ? true : false),
        orderBy: z.union([z.literal('views'), z.literal('likes'), z.literal('createdAt')]).default('createdAt'),
        pageNumber: z
            .string()
            .optional()
            .default('0')
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val), { message: 'Invalid pageNumber, must be a number' }),
    })
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
        name: z.string().min(1, 'The tag name needs to be least one character long')
    }),
    urlSearchParams: z.object({
        ascending: z.union([z.literal('true'), z.literal('false')]).optional().default('false').transform(val => val === 'true' ? true : false),
        orderBy: z.union([z.literal('views'), z.literal('likes'), z.literal('createdAt')]).default('createdAt'),
        pageNumber: z
            .string()
            .optional()
            .default('0')
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val), { message: 'Invalid pageNumber, must be a number' }),
    }),
} satisfies TRequestSchema;

const GetPostsWithArtistNameSchema = {
    pathParams: z.object({
        name: z.string().min(1, 'The tag name needs to be least one character long')
    }),
    urlSearchParams: z.object({
        ascending: z.union([z.literal('true'), z.literal('false')]).optional().default('false').transform(val => val === 'true' ? true : false),
        orderBy: z.union([z.literal('views'), z.literal('likes'), z.literal('createdAt')]).default('createdAt'),
        pageNumber: z
            .string()
            .optional()
            .default('0')
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val), { message: 'Invalid pageNumber, must be a number' }),
    }),
} satisfies TRequestSchema;

const createPostFormErrorData = (errorData: Record<string, unknown>, message: string) => {
    return {
        ...errorData,
        reason: message,
    }
};

export const handleCreatePost = async ({ locals, request }: RequestEvent, handlerType: TControllerHandlerVariant) => {
    const uploadForm = await request.formData();
    const {
        description,
        tags: tagsStr,
        artists: artistsStr,
        isNsfw,
        [POST_PICTURE_FORM_FIELD]: postPictures
    } = getFormFields<IUploadFormFields>(uploadForm, [POST_PICTURE_FORM_FIELD]);

    const finalIsNsfw = isNsfw === 'true';
    const postImagesArray = Array.from(postPictures);
    const tags = transformLabels(tagsStr);
    const artists = transformLabels(artistsStr);

    const errorData = {
        description,
        tags,
        artists,
        isNsfw: finalIsNsfw,
    };

    if (!description.length || !tags.length || !artists.length || !postImagesArray.length) {
        const message = 'At least one of the required fields was missing!';
        return createErrorResponse(handlerType, 400, message, createPostFormErrorData(errorData, message));
    }

    if (!isValidDescription(description)) {
        const message = 'The description did not meet the requirements!';
        return createErrorResponse(handlerType, 400, message, createPostFormErrorData(errorData, message));
    }

    if (tags.some((tag) => !isTagValid(tag))) {
        const message = 'At least one of the tags did not meet the labelling requirements!';
        return createErrorResponse(handlerType, 400, message, createPostFormErrorData(errorData, message));
    }

    if (artists.some((artist) => !isArtistValid(artist))) {
        const message = 'At least one of the artists did not meet the labelling requirements!';
        return createErrorResponse(handlerType, 400, message, createPostFormErrorData(errorData, message));
    }

    if (postImagesArray.length > MAXIMUM_IMAGES_PER_POST) {
        const message = 'The number of images sent exceeded the maximum amount allowed per post!';
        return createErrorResponse(handlerType, 400, message, createPostFormErrorData(errorData, message));
    }

    if (postImagesArray.some((postImageFile) => !isFileImage(postImageFile))) {
        const message = 'At least one of the files provided is not an image!';
        return createErrorResponse(handlerType, 400, message, createPostFormErrorData(errorData, message));
    }

    if (postImagesArray.some((postImageFile) => !isFileImageSmall(postImageFile))) {
        const message = 'At least one of the images exceeded the maximum file size allowed for an image!';
        return createErrorResponse(handlerType, 400, message, createPostFormErrorData(errorData, message));
    }

    try {
        const postImageFileBuffers = await runPostImageTransformationPipelineInBatch(postImagesArray);
        const postImageUrls = await uploadBatchToBucket(
            AWS_POST_PICTURE_BUCKET_NAME,
            'posts',
            postImageFileBuffers
        );

        const newPost = await createPost(
            description,
            finalIsNsfw,
            tags,
            artists,
            postImageUrls,
            locals.user.id
        );

        return createSuccessResponse(handlerType, 'Post created successfully', { newPost });
    } catch (error) {
        const message = 'An error occurred while creating the post';
        return createErrorResponse(handlerType, 500, message, createPostFormErrorData(errorData, message));
    }
};


export const handleGetPost = async (event: RequestEvent, handlerType: TControllerHandlerVariant) => {
    return await validateAndHandleRequest(event, handlerType, GetPostSchema,
        async data => {
            const postId = data.pathParams.postId;

            try {
                const post = handlerType === 'api-route' ? await findPostById(postId, PUBLIC_POST_SELECTORS)
                    : await findPostByIdWithUpdatedViewCount(postId, PUBLIC_POST_SELECTORS);
                if (!post) {
                    const error = createErrorResponse(handlerType, 404, `Post with id ${postId} not found`);
                    if (handlerType === 'page-server-load') {
                        throw error;
                    }
                    return error;
                }

                if (handlerType === 'page-server-load') {
                    cacheResponse(event.setHeaders, SINGLE_POST_CACHE_TIME_SECONDS);
                }

                const uploadedSuccessfully = data.urlSearchParams.uploadedSuccessfully;
                const finalData = handlerType === 'api-route' ? post : { post, uploadedSuccessfully: uploadedSuccessfully === 'true' }
                return createSuccessResponse(handlerType, `Successfully fetched post with id: ${postId}`, finalData);
            } catch (error) {
                return createErrorResponse(handlerType, 500, 'An error occurred while fetching the post');
            }
        }
    )
};

export const handleGetPostsWithArtistName = async (event: RequestEvent, handlerType: TControllerHandlerVariant) => {
    return await validateAndHandleRequest(event, handlerType, GetPostsWithArtistNameSchema,
        async data => {
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
                    PUBLIC_POST_SELECTORS
                );
                const likedPosts = user.id !== NULLABLE_USER.id ? await findLikedPostsFromSubset(user.id, posts) : [];

                const responseData = {
                    posts,
                    likedPosts,
                    pageNumber,
                    ascending,
                    orderBy: orderBy as TPostOrderByColumn
                };
                return createSuccessResponse(handlerType, `Successfully fetched the posts with the artist name of: ${artistName}`, responseData);
            } catch (error) {
                console.error(error);
                const errorResponse = createErrorResponse(handlerType, 500, 'An unexpected error occured while fetching the posts with artists with a certain name');
                if (handlerType === 'page-server-load') {
                    throw errorResponse;
                }

                return errorResponse;
            }
        }
    )
};

export const handleGetPostsWithTagName = async (event: RequestEvent, handlerType: TControllerHandlerVariant) => {
    return await validateAndHandleRequest(event, handlerType, GetPostsWithTagNameSchema,
        async data => {
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
                    PUBLIC_POST_SELECTORS
                );
                const likedPosts = user.id !== NULLABLE_USER.id ? await findLikedPostsFromSubset(user.id, posts) : [];

                const responseData = {
                    posts,
                    likedPosts,
                    pageNumber,
                    ascending,
                    orderBy: orderBy as TPostOrderByColumn
                };
                return createSuccessResponse(handlerType, `Successfully fetched the posts with the artist name of: ${tagName}`, responseData);
            } catch (error) {
                const errorResponse = createErrorResponse(handlerType, 500, 'An unexpected error occured while fetching the posts with tags with a certain name');
                if (handlerType === 'page-server-load') {
                    throw errorResponse;
                }

                return errorResponse;
            }
        }
    )
};

export const handleGetPosts = async (event: RequestEvent, handlerType: TControllerHandlerVariant, overrideCategory?: TPostFetchCategory) => {
    return await validateAndHandleRequest(event, handlerType, GetPostsSchema,
        async data => {
            const category = overrideCategory ?? data.urlSearchParams.category;
            const { ascending, orderBy, pageNumber, userId } = data.urlSearchParams;
            const user = event.locals.user;

            if (user.id === NULLABLE_USER.id && ['uploaded', 'liked'].includes(category)) {
                throw redirect(302, '/');
            }


            if (user.id === NULLABLE_USER.id && category === 'liked') {
                const errorResponse = createErrorResponse(handlerType, 401, 'Cannot fetch liked posts of unauthenticated user');
                if (handlerType === 'page-server-load') {
                    throw errorResponse;
                }
            }

            try {
                let posts: TPost[] = [];
                switch (category) {
                    case 'general':
                        posts = await findPostsByPage(pageNumber, MAXIMUM_POSTS_PER_PAGE, orderBy as TPostOrderByColumn, ascending, PUBLIC_POST_SELECTORS);
                        break;
                    case 'liked':
                        posts =
                            (await findLikedPostsByAuthorId(
                                pageNumber,
                                MAXIMUM_POSTS_PER_PAGE,
                                user.id,
                                orderBy as TPostOrderByColumn,
                                ascending,
                                PUBLIC_POST_SELECTORS
                            )) ?? [];
                        break;
                    case 'uploaded':
                        posts = (await findPostsByAuthorId(
                            pageNumber,
                            MAXIMUM_POSTS_PER_PAGE,
                            userId ?? user.id,
                            orderBy as TPostOrderByColumn,
                            ascending,
                            PUBLIC_POST_SELECTORS
                        )) ?? [];
                        break;
                }

                if (handlerType === 'api-route') {
                    const responseData = {
                        posts,
                        pageNumber,
                        ascending,
                        orderBy,
                    }
                    return createSuccessResponse(handlerType, 'Successfully fetched paginated posts', responseData);
                }

                const likedPosts = user.id !== NULLABLE_USER.id && category !== 'liked' ? await findLikedPostsFromSubset(user.id, posts) : posts;
                const responseData = {
                    posts,
                    likedPosts: user.id !== NULLABLE_USER.id ? likedPosts : [],
                    pageNumber,
                    ascending,
                    orderBy,
                };

                return createSuccessResponse(handlerType, 'Successfully fetched paginated posts', responseData);
            } catch (error) {
                const errorResponse = createErrorResponse(handlerType, 500, 'An error occurred while fetching the posts');
                if (handlerType === 'page-server-load') {
                    throw errorResponse;
                }

                return errorResponse;
            }
        }
    );
};

export const handleDeletePost = async (event: RequestEvent) => {
    return await validateAndHandleRequest(event, 'api-route', DeletePostSchema,
        async data => {
            const postId = data.pathParams.postId;

            try {
                const post = await findPostById(postId, PUBLIC_POST_SELECTORS);
                if (!post) {
                    return createErrorResponse('api-route', 404, `A post with the following id: ${postId} does not exist`);
                }

                if (event.locals.user.id !== post.author.id) {
                    return createErrorResponse('api-route', 401, 'You are not authorized to delete this post, as you are not the author');
                }

                await deletePostById(postId, event.locals.user.id);

                if (post.imageUrls.length > 0) {
                    await deleteBatchFromBucket(
                        AWS_POST_PICTURE_BUCKET_NAME,
                        post.imageUrls,
                    );
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
    return await validateAndHandleRequest(event, 'api-route', LikePostSchema,
        async data => {
            const postId = data.pathParams.postId;
            const action = data.body.action;

            try {
                const post = await findPostById(postId, { likes: true });
                if (!post) {
                    return createErrorResponse('api-route', 404, `A post with the id: ${postId} does not exist`);
                }

                if (post.likes - 1 < 0 && action === 'dislike') {
                    return createErrorResponse('api-route', 409, `The post with the id: ${postId} has 0 likes, and cannot be disliked further`);
                }

                const likedPost = await likePostById(postId, action, event.locals.user.id);
                if (!likedPost) {
                    return createErrorResponse('api-route', 500, 'An unexpected error occured while liking the post');
                }

                return createSuccessResponse('api-route', `The post with the id: ${postId} was successfully ${action === 'like' ? 'liked' : 'disliked'}`);
            }
            catch (error) {
                return createErrorResponse('api-route', 500, 'An error occured while liking the post');
            }
        },
        true,
    );
};