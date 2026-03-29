import { updateCollectionModerationStatus } from '../../db/actions/collection';
import { updatePost } from '../../db/actions/post';
import { updateUserModerationStatus } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { invalidateCacheRemotely } from '../../helpers/sessions';
import logger from '../../logging/logger';
import { getCacheKeyForPendingPosts } from '../cache-strategies/moderation';
import { OwnerAmendResourceModerationSchema } from '../request-schemas/moderation';
import { handleOwnerRoleCheck } from './ownerRoleCheck';
import type { RequestEvent } from '@sveltejs/kit';

export const handleOwnerAmendResourceModerationStatus = async (event: RequestEvent) => {
	return validateAndHandleRequest(
		event,
		'api-route',
		OwnerAmendResourceModerationSchema,
		async (data) => {
			try {
				const ownerFailureResponse = await handleOwnerRoleCheck(event, 'api-route');
				if (ownerFailureResponse) return ownerFailureResponse;

				const payload = data.body;

				if (payload.resourceType === 'post') {
					const updatedPost = await updatePost(payload.resourceId, {
						moderationStatus: payload.status,
					});
					invalidateCacheRemotely(getCacheKeyForPendingPosts(0));

					return createSuccessResponse('api-route', 'Resource moderation status updated.', {
						resourceType: 'post',
						moderationStatus: updatedPost.moderationStatus,
					});
				}

				if (payload.resourceType === 'user') {
					const updatedUser = await updateUserModerationStatus(payload.resourceId, payload.status);

					return createSuccessResponse('api-route', 'Resource moderation status updated.', {
						resourceType: 'user',
						moderationStatus: updatedUser.moderationStatus,
					});
				}

				const updatedCollection = await updateCollectionModerationStatus(
					payload.resourceId,
					payload.status,
				);

				return createSuccessResponse('api-route', 'Resource moderation status updated.', {
					resourceType: 'postCollection',
					moderationStatus: updatedCollection.moderationStatus,
				});
			} catch (err) {
				logger.error(err);

				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while updating moderation status.',
				);
			}
		},
		true,
	);
};
