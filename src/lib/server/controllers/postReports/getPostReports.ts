import { findPostById } from '../../db/actions/post';
import { findPostReportsFromPostId } from '../../db/actions/postReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { handleModerationRoleCheck } from '../reports';
import { GetPostReportsSchema } from '../request-schemas/postReports';
import type { RequestEvent } from '@sveltejs/kit';

export const handleGetPostReports = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetPostReportsSchema,
		async (data) => {
			const postId = data.pathParams.postId;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, handlerType);
				if (moderationFailureResponse) return moderationFailureResponse;

				const post = await findPostById(postId, { id: true });
				if (!post) {
					return createErrorResponse(
						handlerType,
						404,
						'The post you are trying to fetch reports for does not exist.',
					);
				}

				const postReports = await findPostReportsFromPostId(postId);
				return createSuccessResponse(handlerType, 'Successfully fetched the post reports.', {
					postReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occurred while fetching the post reports.',
				);
			}
		},
		true,
	);
};
