import { findCollectionById } from '../../db/actions/collection';
import { findPostById } from '../../db/actions/post';
import { findUserById } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { OwnerResourceModerationStatusGetSchema } from '../request-schemas/moderation';
import { handleOwnerRoleCheck } from './ownerRoleCheck';
import type { RequestEvent } from '@sveltejs/kit';

export const handleGetOwnerResourceModerationStatus = async (event: RequestEvent) => {
	return validateAndHandleRequest(
		event,
		'api-route',
		OwnerResourceModerationStatusGetSchema,
		async (data) => {
			try {
				const ownerFailureResponse = await handleOwnerRoleCheck(event, 'api-route');
				if (ownerFailureResponse) return ownerFailureResponse;

				const { resourceType, resourceId } = data.urlSearchParams;

				if (resourceType === 'post') {
					const post = await findPostById(resourceId, { moderationStatus: true }, [
						'PENDING',
						'APPROVED',
						'REJECTED',
					]);
					if (!post) {
						return createErrorResponse('api-route', 404, 'Post not found.');
					}
					return createSuccessResponse('api-route', 'Moderation status loaded.', {
						moderationStatus: post.moderationStatus,
					});
				}

				if (resourceType === 'user') {
					const targetUser = await findUserById(resourceId, { moderationStatus: true });
					if (!targetUser) {
						return createErrorResponse('api-route', 404, 'User not found.');
					}
					return createSuccessResponse('api-route', 'Moderation status loaded.', {
						moderationStatus: targetUser.moderationStatus,
					});
				}

				const collection = await findCollectionById(resourceId, { moderationStatus: true });
				if (!collection) {
					return createErrorResponse('api-route', 404, 'Collection not found.');
				}
				return createSuccessResponse('api-route', 'Moderation status loaded.', {
					moderationStatus: collection.moderationStatus,
				});
			} catch (err) {
				logger.error(err);

				return createErrorResponse(
					'api-route',
					500,
					'An error occurred while loading moderation status.',
				);
			}
		},
		true,
	);
};
