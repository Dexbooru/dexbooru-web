import { isModerationRole } from '$lib/shared/helpers/auth/role';
import { updatePost } from '../../db/actions/post';
import { findUserById } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import logger from '../../logging/logger';
import { UpdatePostModerationStatusSchema } from '../request-schemas/moderation';
import { getCacheKeyForPendingPosts } from '../cache-strategies/moderation';
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
				const user = await findUserById(event.locals.user.id, { role: true });
				if (!user) {
					return createErrorResponse('api-route', 404, 'This user does not exist.');
				}
				if (!isModerationRole(user.role)) {
					return createErrorResponse(
						'api-route',
						403,
						'You do not have permission to update post moderation status.',
					);
				}
				if (status === 'PENDING' && user.role !== 'OWNER') {
					return createErrorResponse(
						'api-route',
						403,
						'Only the site owner can set a post back to pending moderation.',
					);
				}

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
