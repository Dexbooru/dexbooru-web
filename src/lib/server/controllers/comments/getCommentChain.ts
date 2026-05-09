import type { TComment } from '$lib/shared/types/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_COMMENT_SELECTORS } from '../../constants/comments';
import { findCommentAncestorChain, findCommentById } from '../../db/actions/comment';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { GetCommentSchema } from '../request-schemas/comments';

export const handleGetCommentChain = async (event: RequestEvent) => {
	return await validateAndHandleRequest(event, 'api-route', GetCommentSchema, async (data) => {
		const { commentId } = data.pathParams;

		try {
			const targetComment = await findCommentById(commentId, {
				id: true,
			});
			if (!targetComment) {
				return createErrorResponse(
					'api-route',
					404,
					`A comment with the id: ${commentId} does not exist`,
				);
			}

			const commentChain = (await findCommentAncestorChain(
				commentId,
				PUBLIC_COMMENT_SELECTORS,
			)) as TComment[];
			return createSuccessResponse('api-route', 'Comment chain fetched successfully', {
				commentChain,
			});
		} catch (error) {
			logger.error(error);
			return createErrorResponse(
				'api-route',
				500,
				'An unexpected error occurred while fetching the comment chain',
			);
		}
	});
};
