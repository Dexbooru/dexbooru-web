import type { TComment } from '$lib/shared/types/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_COMMENT_SELECTORS } from '../../constants/comments';
import { findCommentById, findCommentsByPostId } from '../../db/actions/comment';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { GetCommentSchema } from '../request-schemas/comments';

export const handleGetComment = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(event, handlerType, GetCommentSchema, async (data) => {
		const { commentId } = data.pathParams;

		try {
			const targetComment = await findCommentById(commentId, {
				id: true,
				postId: true,
				post: {
					select: {
						id: true,
						description: true,
					},
				},
			});

			if (!targetComment) {
				return createErrorResponse(
					handlerType,
					404,
					`A comment with the id: ${commentId} does not exist`,
				);
			}

			const allPostComments = (await findCommentsByPostId(
				targetComment.postId,
				PUBLIC_COMMENT_SELECTORS,
			)) as TComment[];

			// Filter to get thread: target comment + all descendants
			const thread: TComment[] = [];
			const queue = [commentId];
			const commentMap = new Map(allPostComments.map((c) => [c.id, c]));

			while (queue.length > 0) {
				const currentId = queue.shift()!;
				const comment = commentMap.get(currentId);
				if (comment) {
					thread.push(comment);
					const children = allPostComments
						.filter((c) => c.parentCommentId === currentId)
						.map((c) => c.id);
					queue.push(...children);
				}
			}

			return createSuccessResponse(handlerType, 'Comment thread fetched successfully', {
				comment: targetComment,
				thread,
			});
		} catch (error) {
			logger.error(error);
			return createErrorResponse(
				handlerType,
				500,
				'An unexpected error occurred while fetching the comment thread',
			);
		}
	});
};
