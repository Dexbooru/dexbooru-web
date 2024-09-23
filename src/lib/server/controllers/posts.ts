import { MAXIMUM_IMAGES_PER_POST } from "$lib/shared/constants/images";
import { POST_FETCH_CATEGORIES, POST_FETCH_CATEGORY_URL_PARAMETER_NAME, POST_FETCH_USER_ID_URL_PARAMETER_NAME, POST_ID_URL_PARAMETER_NAME, POST_PICTURE_FORM_FIELD } from "$lib/shared/constants/posts";
import { getFormFields } from "$lib/shared/helpers/forms";
import { isFileImage, isFileImageSmall } from "$lib/shared/helpers/images";
import { isArtistValid, isTagValid, isValidDescription, transformLabels } from "$lib/shared/helpers/labels";
import type { TPost, TPostOrderByColumn } from "$lib/shared/types/posts";
import type { IUploadFormFields } from "$lib/shared/types/upload";
import type { RequestEvent } from "@sveltejs/kit";
import { deleteBatchFromBucket, uploadBatchToBucket } from "../aws/actions/s3";
import { AWS_POST_PICTURE_BUCKET_NAME } from "../constants/aws";
import { MAXIMUM_POSTS_PER_PAGE, PUBLIC_POST_SELECTORS } from "../constants/posts";
import { SINGLE_POST_CACHE_TIME_SECONDS } from "../constants/sessions";
import { createPost, deletePostById, findPostById, findPostByIdWithUpdatedViewCount, findPostsByAuthorId, findPostsByPage } from "../db/actions/post";
import { findLikedPostsByAuthorId, findLikedPostsFromSubset } from "../db/actions/user";
import { createErrorResponse, createSuccessResponse } from "../helpers/controllers";
import { runPostImageTransformationPipelineInBatch } from "../helpers/images";
import { processPostPageParams } from "../helpers/pagination";
import { cacheResponse } from "../helpers/sessions";
import { parseUser } from "../helpers/users";
import type { TControllerHandlerVariant, TPostFetchCategory } from "../types/controllers";

const createPostFormErrorData = (errorData: Record<string, unknown>, message: string) => {
    return {
        ...errorData,
        reason: message,
    }
};

const createDeletePostErrorData = (postId: string | null, message: string) => {
    return {
        postId,
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


export const handleGetPost = async ({ url, params, setHeaders }: RequestEvent, handlerType: TControllerHandlerVariant) => {
    const postId = handlerType === 'api-route' ? url.searchParams.get(POST_ID_URL_PARAMETER_NAME) : params[POST_ID_URL_PARAMETER_NAME] ?? '';

    if (postId === null) {
        return createErrorResponse(handlerType, 400, 'Missing required field: postId');
    }

    if (postId.length === 0) {
        return createErrorResponse(handlerType, 400, 'Required field: postId cannot be an empty string');
    }

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
            cacheResponse(setHeaders, SINGLE_POST_CACHE_TIME_SECONDS);
        }

        const uploadedSuccessfully = url.searchParams.get('uploadedSuccessfully');
        const finalData = handlerType === 'api-route' ? post : { post, uploadedSuccessfully: uploadedSuccessfully === 'true' }
        return createSuccessResponse(handlerType, `Successfully fetched post with id: ${postId}`, finalData);
    } catch (error) {
        return createErrorResponse(handlerType, 500, 'An error occurred while fetching the post');
    }
};


export const handleGetPosts = async ({ url, locals }: RequestEvent, handlerType: TControllerHandlerVariant, overrideCategory?: TPostFetchCategory) => {
    const category = overrideCategory ?? url.searchParams.get(POST_FETCH_CATEGORY_URL_PARAMETER_NAME) as TPostFetchCategory;

    if (category === undefined || category === null) {
        return createErrorResponse(handlerType, 400, `Missing required field: ${POST_FETCH_CATEGORY_URL_PARAMETER_NAME}`);
    }

    if (category.length === 0) {
        return createErrorResponse(handlerType, 400, `Required field: ${POST_FETCH_CATEGORY_URL_PARAMETER_NAME} cannot be empty`);
    }

    if (!POST_FETCH_CATEGORIES.includes(category)) {
        return createErrorResponse(handlerType, 400, `Invalid post category for fetching`);
    }

    const user = parseUser(locals);
    const { convertedAscending, orderBy, convertedPageNumber } = processPostPageParams(
        url.searchParams
    );
    const userId = url.searchParams.get(POST_FETCH_USER_ID_URL_PARAMETER_NAME);

    if (!user && category === 'liked') {
        return createErrorResponse(handlerType, 401, 'Cannot fetch liked posts of unauthenticated user');
    }

    let posts: TPost[] = [];
    switch (category) {
        case 'general':
            posts = await findPostsByPage(convertedPageNumber, MAXIMUM_POSTS_PER_PAGE, orderBy as TPostOrderByColumn, convertedAscending, PUBLIC_POST_SELECTORS);
            break;
        case 'liked':
            posts =
                (await findLikedPostsByAuthorId(
                    convertedPageNumber,
                    MAXIMUM_POSTS_PER_PAGE,
                    user?.id ?? '',
                    orderBy as TPostOrderByColumn,
                    convertedAscending,
                    PUBLIC_POST_SELECTORS
                )) ?? [];
            break;
        case 'uploaded':
            posts = (await findPostsByAuthorId(
                convertedPageNumber,
                MAXIMUM_POSTS_PER_PAGE,
                userId ?? user?.id ?? '',
                orderBy as TPostOrderByColumn,
                convertedAscending,
                PUBLIC_POST_SELECTORS
            )) ?? [];
            break;
    }

    if (handlerType === 'api-route') {
        const data = {
            posts,
            pageNumber: convertedPageNumber,
            ascending: convertedAscending,
            orderBy,
        }
        return createSuccessResponse(handlerType, 'Successfully fetched paginated posts', data);
    }

    const likedPosts = user && category !== 'liked' ? await findLikedPostsFromSubset(user.id, posts) : posts;
    const data = {
        posts,
        likedPosts: user !== null ? likedPosts : [],
        pageNumber: convertedPageNumber,
        ascending: convertedAscending,
        orderBy,
    }

    return createSuccessResponse(handlerType, 'Successfully fetched paginated posts', data);
};

export const handleDeletePost = async ({ locals, url }: RequestEvent, handlerType: TControllerHandlerVariant) => {
    const postId = url.searchParams.get(POST_ID_URL_PARAMETER_NAME);

    if (postId === null) {
        const message = 'Missing required field: postId';
        return createErrorResponse(handlerType, 400, message, createDeletePostErrorData(postId, message));
    }

    if (postId.length === 0) {
        const message = 'Required field: postId cannot be an empty string';
        return createErrorResponse(handlerType, 400, message, createDeletePostErrorData(postId, message));
    }

    try {
        const post = await findPostById(postId, PUBLIC_POST_SELECTORS);

        if (!post) {
            const message = `A post with the following id: ${postId} does not exist`;
            return createErrorResponse(handlerType, 404, message, createDeletePostErrorData(postId, message));
        }

        if (locals.user.id !== post.authorId) {
            const message = 'You are not authorized to delete this post, as you are not the author';
            return createErrorResponse(handlerType, 401, message, createDeletePostErrorData(postId, message));
        }

        await deletePostById(postId, locals.user.id);

        if (post.imageUrls.length > 0) {
            await deleteBatchFromBucket(
                AWS_POST_PICTURE_BUCKET_NAME,
                post.imageUrls,
            );
        }

        const successMessage = `A post with the id: ${postId} and its corresponding comments and images were deleted successfully!`;
        return createSuccessResponse(handlerType, successMessage, post);

    } catch (error) {
        console.error('Error deleting post:', error);
        const message = 'An error occurred while deleting the post';
        return createErrorResponse(handlerType, 500, message, createDeletePostErrorData(postId, message));
    }
};

