import { isModerationRole } from '$lib/shared/helpers/auth/role';
import type { TComment } from '$lib/shared/types/comments';
import type { RequestEvent } from '@sveltejs/kit';
import {
	deleteCommentById,
	editCommentContentById,
	findCommentById,
} from '../../db/actions/comment';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import logger from '../../logging/logger';
import { getCacheKeyForIndividualPost } from '../cache-strategies/posts';
import { DeletePostCommentsSchema } from '../request-schemas/comments';

export const handleDeletePostComment = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeletePostCommentsSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const commentId = data.urlSearchParams.commentId;

			try {
				const comment = (await findCommentById(commentId, {
					postId: true,
					authorId: true,
					author: { select: { role: true } },
				})) as TComment;
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

				if (comment.authorId !== event.locals.user.id && !isModerationRole(comment.author.role)) {
					return createErrorResponse(
						'api-route',
						403,
						`The authenticated user with id: ${event.locals.user.id} does not match the comment's author id or they do not have moderator permissions`,
					);
				}

				if (comment.authorId !== event.locals.user.id && isModerationRole(comment.author.role)) {
					await editCommentContentById(
						commentId,
						'This comment has been removed by a site moderator',
					);
				} else {
					await deleteCommentById(commentId, postId);
				}

				const postCacheKey = getCacheKeyForIndividualPost(postId);
				invalidateCacheRemotely(postCacheKey);

				return createSuccessResponse(
					'api-route',
					`A comment with the id: ${commentId} and its corresponding replies were deleted successfuly!`,
				);
			} catch (error) {
				logger.error(error);

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
