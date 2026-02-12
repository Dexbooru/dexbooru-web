import { MAXIMUM_COMMENTS_PER_PAGE } from '$lib/shared/constants/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { PUBLIC_COMMENT_SELECTORS } from '../../constants/comments';
import { findPaginatedCommentsByPostId } from '../../db/actions/comment';
import { findPostById } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { GetPostCommentsSchema } from '../request-schemas/comments';

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

			const comments = await findPaginatedCommentsByPostId(
				postId,
				parentCommentId === 'null' ? null : parentCommentId,
				pageNumber,
				MAXIMUM_COMMENTS_PER_PAGE,
				PUBLIC_COMMENT_SELECTORS,
			);

			return createSuccessResponse('api-route', 'Comments fetched successfully', comments);
		} catch (error) {
			logger.error(error);

			return createErrorResponse(
				'api-route',
				500,
				'An unexpected error occurred while fetching the comments',
			);
		}
	});
};
