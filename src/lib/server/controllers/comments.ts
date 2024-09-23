import { COMMENT_CONTENT_BODY_PARAMETER_NAME, MAXIMUM_CONTENT_LENGTH, PAGE_NUMBER_URL_PARAMETER, PARENT_COMMENT_ID_URL_PARAMETER } from "$lib/shared/constants/comments";
import { POST_ID_URL_PARAMETER_NAME } from "$lib/shared/constants/posts";
import type { ICommentCreateBody } from "$lib/shared/types/comments";
import type { RequestEvent } from "@sveltejs/kit";
import { MAX_COMMENTS_PER_PAGE, PUBLIC_COMMENT_SELECTORS } from "../constants/comments";
import { createComment, findCommentsByPostId } from "../db/actions/comment";
import { findPostById } from "../db/actions/post";
import { createErrorResponse, createSuccessResponse } from "../helpers/controllers";
import { parseUser } from "../helpers/users";

export const handleGetPostComments = async ({ url }: RequestEvent) => {
    const postId = url.searchParams.get(POST_ID_URL_PARAMETER_NAME);
    const parentCommentId = url.searchParams.get(PARENT_COMMENT_ID_URL_PARAMETER);
    const pageNumber = url.searchParams.get(PAGE_NUMBER_URL_PARAMETER);

    if (postId === null || parentCommentId === null || pageNumber === null) {
        return createErrorResponse('api-route', 400, 'At least one of the required fields was missing');
    }

    if (postId.trim() === '') {
        return createErrorResponse('api-route', 400, `${POST_ID_URL_PARAMETER_NAME} parameter cannot be an empty string`);
    }
    if (parentCommentId.trim() === '') {
        return createErrorResponse('api-route', 400, `${PARENT_COMMENT_ID_URL_PARAMETER} parameter cannot be an empty string`);
    }
    if (pageNumber.trim() === '') {
        return createErrorResponse('api-route', 400, `${PAGE_NUMBER_URL_PARAMETER} parameter cannot be an empty string`);
    }

    const convertedPageNumber = parseInt(pageNumber);
    if (isNaN(convertedPageNumber)) {
        return createErrorResponse('api-route', 400, 'The page number parameter must be in a valid number format!');
    }
    if (convertedPageNumber < 0) {
        return createErrorResponse('api-route', 400, 'The page number must be a positive, whole number!');
    }

    const post = await findPostById(postId, { id: true });
    if (!post) {
        return createErrorResponse('api-route', 404, `A post with the id: ${postId} does not exist`);
    }

    try {
        const comments = await findCommentsByPostId(
            postId,
            parentCommentId === 'null' ? null : parentCommentId,
            convertedPageNumber,
            MAX_COMMENTS_PER_PAGE,
            PUBLIC_COMMENT_SELECTORS
        );
        return createSuccessResponse('api-route', 'Comments fetched successfully', comments);
    } catch (error) {
        return createErrorResponse('api-route', 500, 'An unexpected error occurred');
    }
};

export const handleCreatePostComment = async ({ request, locals }: RequestEvent) => {
    const user = parseUser(locals);

    const { postId, parentCommentId, content }: ICommentCreateBody = await request.json();
    if (postId === null || parentCommentId === undefined || content === null) {
        return createErrorResponse('api-route', 400, 'At least one of the required fields was missing');
    }

    if (postId.trim() === '') {
        return createErrorResponse('api-route', 400, `The ${POST_ID_URL_PARAMETER_NAME} parameter cannot be an empty string`);
    }

    if (content.trim() === '') {
        return createErrorResponse('api-route', 400, `The ${COMMENT_CONTENT_BODY_PARAMETER_NAME} parameter cannot be an empty string`);
    }

    if (parentCommentId?.trim() === '') {
        return createErrorResponse('api-route', 400, `The ${PARENT_COMMENT_ID_URL_PARAMETER} parameter cannot be an empty string`);
    }

    if (content.length > MAXIMUM_CONTENT_LENGTH) {
        return createErrorResponse('api-route', 400, `The maximum size for the comment content is ${MAXIMUM_CONTENT_LENGTH} characters`);
    }

    const newComment = await createComment(user?.id ?? '', postId, content, parentCommentId);
    const { id: commentId } = newComment;

    return createSuccessResponse('api-route', `A new comment with the id: ${commentId} was created for the post with the id: ${postId} by an author with the id: ${user?.id ?? ''}!`, newComment, 201);
};