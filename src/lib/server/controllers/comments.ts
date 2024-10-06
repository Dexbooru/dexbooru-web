import { MAXIMUM_CONTENT_LENGTH } from '$lib/shared/constants/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { MAX_COMMENTS_PER_PAGE, PUBLIC_COMMENT_SELECTORS } from '../constants/comments';
import { pageNumberSchema } from '../constants/reusableSchemas';
import { createComment, findCommentsByPostId } from '../db/actions/comment';
import { findPostById } from '../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import type { TRequestSchema } from '../types/controllers';

const GetPostCommentsSchema = {
	urlSearchParams: z.object({
		pageNumber: pageNumberSchema,
		parentCommentId: z.string().optional().default('null'),
	}),
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const CreateCommentSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		parentCommentId: z.union([z.string(), z.null()]),
		content: z
			.string()
			.trim()
			.min(1, 'The comment content cannot be empty')
			.refine((val) => val.length <= MAXIMUM_CONTENT_LENGTH, {
				message: `The maximum content length for a comment is: ${MAXIMUM_CONTENT_LENGTH} characters`,
			}),
	}),
} satisfies TRequestSchema;

export const handleGetPostComments = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetPostCommentsSchema, async (data) => {
		const postId = data.pathParams.postId;
		const parentCommentId = data.urlSearchParams.parentCommentId;
		const pageNumber = data.urlSearchParams.pageNumber;

		try {
			const post = await findPostById(postId, { id: true });
			if (!post) {
				return createErrorResponse(
					'api-route',
					404,
					`A post with the id: ${postId} does not exist`,
				);
			}

			const comments = await findCommentsByPostId(
				postId,
				parentCommentId === 'null' ? null : parentCommentId,
				pageNumber,
				MAX_COMMENTS_PER_PAGE,
				PUBLIC_COMMENT_SELECTORS,
			);

			return createSuccessResponse('api-route', 'Comments fetched successfully', comments);
		} catch (error) {
			console.log(error);
			return createErrorResponse(
				'api-route',
				500,
				'An unexpected error occurred while fetching the comments',
			);
		}
	});
};

export const handleCreatePostComment = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreateCommentSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const { parentCommentId, content } = data.body;

			try {
				const newComment = await createComment(
					event.locals.user.id,
					postId,
					content,
					parentCommentId,
				);
				const { id: newCommentId } = newComment;

				return createSuccessResponse(
					'api-route',
					`Successfully created a new comment with id: ${newCommentId}`,
					newComment,
					201,
				);
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while creating the comment',
				);
			}
		},
		true,
	);
};
