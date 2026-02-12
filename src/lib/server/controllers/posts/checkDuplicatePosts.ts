import { findDuplicatePosts } from '../../db/actions/post';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { CheckDuplicatePostsSchema } from '../request-schemas/posts';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';

export const handleCheckForDuplicatePosts = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		CheckDuplicatePostsSchema,
		async (data) => {
			const { hashes } = data.body;

			try {
				const duplicatePosts = await findDuplicatePosts(hashes, 1, {
					id: true,
					imageUrls: true,
					description: true,
				});

				return createSuccessResponse(handlerType, 'Successfully checked for duplicate posts', {
					duplicatePosts,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occurred while checking for duplicate posts',
				);
			}
		},
		true,
	);
};
