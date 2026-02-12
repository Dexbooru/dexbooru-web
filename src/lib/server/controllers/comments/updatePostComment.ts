import type { RequestEvent } from '@sveltejs/kit';
import { editCommentContentById, findCommentById } from '../../db/actions/comment';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import logger from '../../logging/logger';
import { getCacheKeyForIndividualPost } from '../cache-strategies/posts';
import { EditPostCommentsSchmea } from '../request-schemas/comments';

export const handleUpdatePostComment = async (event: RequestEvent) => {
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

				const updatedComment = await editCommentContentById(commentId, content);

				const postCacheKey = getCacheKeyForIndividualPost(postId);
				invalidateCacheRemotely(postCacheKey);

				return createSuccessResponse(
					'api-route',
					`Successfully edited the comment content for the id: ${commentId}`,
					updatedComment,
				);
			} catch (error) {
				logger.error(error);

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
