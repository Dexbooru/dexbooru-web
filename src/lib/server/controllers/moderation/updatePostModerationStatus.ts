import { updatePost } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import logger from '../../logging/logger';
import { UpdatePostModerationStatusSchema } from '../request-schemas/moderation';
import { getCacheKeyForPendingPosts } from '../cache-strategies/moderation';
import { handleModerationRoleCheck } from '../reports';
import type { RequestEvent } from '@sveltejs/kit';

export const handleUpdatePostModerationStatus = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UpdatePostModerationStatusSchema,
		async (data) => {
			const { postId } = data.pathParams;
			const { status } = data.body;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const updatedPost = await updatePost(postId, {
					moderationStatus: status,
				});

				invalidateCacheRemotely(getCacheKeyForPendingPosts(0));

				return createSuccessResponse('api-route', 'Post moderation status updated successfully', {
					updatedPost,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while updating post moderation status.',
				);
			}
		},
		true,
	);
};
