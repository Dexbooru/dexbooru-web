import { COMMENT_CONTENT_BODY_PARAMETER_NAME, MAXIMUM_CONTENT_LENGTH, PARENT_COMMENT_ID_URL_PARAMETER } from "$lib/shared/constants/comments";
import { POST_ID_URL_PARAMETER_NAME } from "$lib/shared/constants/posts";
import type { ICommentCreateBody } from "$lib/shared/types/comments";
import type { RequestEvent } from "@sveltejs/kit";
import { z } from 'zod';
import { MAX_COMMENTS_PER_PAGE, PUBLIC_COMMENT_SELECTORS } from "../constants/comments";
import { createComment, findCommentsByPostId } from "../db/actions/comment";
import { findPostById } from "../db/actions/post";
import { createErrorResponse, createSuccessResponse, validateAndHandleRequest } from "../helpers/controllers";
import { parseUser } from "../helpers/users";
import type { TRequestSchema } from "../types/controllers";

const GetPostCommentsSchema = {
    urlSearchParams: z.object({
        pageNumber: z
            .string()
            .optional()
            .default('0')
            .transform((val) => parseInt(val, 10))
            .refine((val) => !isNaN(val), { message: 'Invalid pageNumber, must be a number' }),
        parentCommentId: z
            .string()
            .optional()
            .default('null'),
    }),
    pathParams: z.object({
        postId: z.string().uuid(),
    }),
} satisfies TRequestSchema;

export const handleGetPostComments = async (event: RequestEvent) => {
    return await validateAndHandleRequest(event, 'api-route', GetPostCommentsSchema,
        async data => {
            const postId = data.pathParams.postId;
            const parentCommentId = data.urlSearchParams.parentCommentId;
            const pageNumber = data.urlSearchParams.pageNumber;

            try {
                const post = await findPostById(postId, { id: true });
                if (!post) {
                    return createErrorResponse('api-route', 404, `A post with the id: ${postId} does not exist`);
                }

                const comments = await findCommentsByPostId(
                    postId,
                    parentCommentId === 'null' ? null : parentCommentId,
                    pageNumber,
                    MAX_COMMENTS_PER_PAGE,
                    PUBLIC_COMMENT_SELECTORS
                );

                return createSuccessResponse('api-route', 'Comments fetched successfully', comments);
            } catch (error) {
                return createErrorResponse('api-route', 500, 'An unexpected error occurred');
            }
        }
    );
}


export const handleCreatePostComment = async ({ request, locals }: RequestEvent) => {
    const user = parseUser(locals);

    const { postId, parentCommentId, content }: ICommentCreateBody = await request.json();
    if (postId === undefined || parentCommentId === undefined || content === undefined) {
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