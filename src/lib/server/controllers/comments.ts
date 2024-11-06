import { MAXIMUM_CONTENT_LENGTH } from '$lib/shared/constants/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { MAX_COMMENTS_PER_PAGE, PUBLIC_COMMENT_SELECTORS } from '../constants/comments';
import { pageNumberSchema } from '../constants/reusableSchemas';
import {
	createComment,
	deleteCommentById,
	editCommentContentById,
	findCommentById,
	findCommentsByPostId,
} from '../db/actions/comment';
import { findPostById } from '../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import type { TRequestSchema } from '../types/controllers';

const DeletePostCommentsSchema = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	urlSearchParams: z.object({
		commentId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const EditPostCommentsSchmea = {
	pathParams: z.object({
		postId: z.string().uuid(),
	}),
	body: z.object({
		commentId: z.string().uuid(),
		content: z
			.string()
			.trim()
			.min(1, 'The comment content cannot be empty')
			.refine((val) => val.length <= MAXIMUM_CONTENT_LENGTH, {
				message: `The maximum content length for a comment is: ${MAXIMUM_CONTENT_LENGTH} characters`,
			}),
	}),
} satisfies TRequestSchema;

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

export const handleDeletePostComments = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeletePostCommentsSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const commentId = data.urlSearchParams.commentId;

			try {
				const comment = await findCommentById(commentId);
				if (!comment) {
					return createErrorResponse(
						'api-route',
						404,
						`A comment with the id: ${commentId} does not exist`,
					);
				}

				if (comment.postId !== postId) {
					return createErrorResponse(
						'api-route',
						400,
						`The comment's post id does not match: ${postId}`,
					);
				}

				if (comment.authorId !== event.locals.user.id) {
					return createErrorResponse(
						'api-route',
						403,
						`The authenticated user with id: ${event.locals.user.id} does not match the comment's author id`,
					);
				}

				await deleteCommentById(commentId, event.locals.user.id, postId);

				return createSuccessResponse(
					'api-route',
					`A comment with the id: ${commentId} and its corresponding replies were deleted successfuly!`,
				);
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while deleting the post comment',
				);
			}
		},
		true,
	);
};

export const handleEditPostComments = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		EditPostCommentsSchmea,
		async (data) => {
			const postId = data.pathParams.postId;
			const { commentId, content } = data.body;

			try {
				const comment = await findCommentById(commentId);
				if (!comment) {
					return createErrorResponse(
						'api-route',
						404,
						`A comment with the id: ${commentId} does not exist`,
					);
				}

				if (comment.postId !== postId) {
					return createErrorResponse(
						'api-route',
						400,
						`The comment's post id does not match: ${postId}`,
					);
				}

				if (comment.authorId !== event.locals.user.id) {
					return createErrorResponse(
						'api-route',
						403,
						`The authenticated user with id: ${event.locals.user.id} does not match the comment's author id`,
					);
				}

				await editCommentContentById(commentId, content);

				return createSuccessResponse(
					'api-route',
					`Successfully edited the comment content for the id: ${commentId}`,
				);
			} catch {
				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occured while trying to update the comment',
				);
			}
		},
		true,
	);
};

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
