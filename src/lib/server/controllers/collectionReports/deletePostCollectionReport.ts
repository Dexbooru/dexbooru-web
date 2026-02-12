import { findCollectionById } from '../../db/actions/collection';
import { deletePostCollectionReportByIds } from '../../db/actions/collectionReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { handleModerationRoleCheck } from '../reports';
import { DeletePostCollectionReportSchema } from '../request-schemas/collectionReports';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

export const handleDeletePostCollectionReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeletePostCollectionReportSchema,
		async (data) => {
			const collectionId = data.pathParams.collectionId;
			const reportId = data.urlSearchParams.reportId;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const collection = await findCollectionById(collectionId, { id: true });
				if (!collection) {
					return createErrorResponse(
						'api-route',
						404,
						'The post collection you are trying to delete a report for does not exist.',
					);
				}

				const deletedReport = await deletePostCollectionReportByIds(collection.id, reportId);
				if (!deletedReport) {
					return createErrorResponse(
						'api-route',
						404,
						'The post collection report you are trying to delete does not exist.',
					);
				}

				return createSuccessResponse(
					'api-route',
					'Successfully deleted the post collection report.',
					deletedReport,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while deleting the post collection report.',
				);
			}
		},
		true,
	);
};
