import { MAXIMUM_COMMENTS_PER_PAGE } from '$lib/shared/constants/comments';
import type { RequestEvent } from '@sveltejs/kit';
import { GENERAL_COMMENTS_SELECTORS } from '../../constants/comments';
import { findCommentsByAuthorId } from '../../db/actions/comment';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { GeneralCommentsSchema } from '../request-schemas/comments';

export const handleGetAuthenticatedUserComments = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GeneralCommentsSchema,
		async (data) => {
			const user = event.locals.user;
			const { orderBy, pageNumber } = data.urlSearchParams;

			try {
				const comments = await findCommentsByAuthorId(
					user.id,
					pageNumber,
					MAXIMUM_COMMENTS_PER_PAGE,
					orderBy,
					GENERAL_COMMENTS_SELECTORS,
				);

				const responseData = {
					comments,
					pageNumber,
					orderBy,
					ascending: false,
				};

				return createSuccessResponse(handlerType, 'Comments fetched successfully', responseData);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					"An unexpected error occurred while fetching authenticated user's the comments",
				);
			}
		},
		true,
	);
};
