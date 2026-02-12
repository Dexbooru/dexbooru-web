import { findCollectionById } from '../../db/actions/collection';
import { findPostCollectionReportsFromCollectionId } from '../../db/actions/collectionReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { handleModerationRoleCheck } from '../reports';
import { GetPostCollectionReportsSchema } from '../request-schemas/collectionReports';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';
import type { TControllerHandlerVariant } from '../../types/controllers';

export const handleGetPostCollectionReports = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetPostCollectionReportsSchema,
		async (data) => {
			const collectionId = data.pathParams.collectionId;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, handlerType);
				if (moderationFailureResponse) return moderationFailureResponse;

				const collection = await findCollectionById(collectionId, { id: true });
				if (!collection) {
					return createErrorResponse(
						handlerType,
						404,
						'The post collection you are trying to fetch reports for does not exist.',
					);
				}

				const postCollectionReports = await findPostCollectionReportsFromCollectionId(
					collection.id,
				);
				return createSuccessResponse(
					handlerType,
					'Successfully fetched the post collection reports.',
					{ postCollectionReports },
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occurred while fetching the post collection reports.',
				);
			}
		},
		true,
	);
};
