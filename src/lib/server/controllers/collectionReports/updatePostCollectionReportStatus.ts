import {
	findPostCollectionReportById,
	updatePostCollectionReportStatus,
} from '../../db/actions/collectionReport';
import { updateCollectionModerationStatus } from '../../db/actions/collection';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import { handleModerationRoleCheck } from '../reports';
import { UpdatePostCollectionReportStatusSchema } from '../request-schemas/collectionReports';
import logger from '../../logging/logger';
import type { RequestEvent } from '@sveltejs/kit';

export const handleUpdatePostCollectionReportStatus = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UpdatePostCollectionReportStatusSchema,
		async (data) => {
			const { reportId } = data.pathParams;
			const { reviewStatus } = data.body;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const updatedReport = await updatePostCollectionReportStatus(reportId, reviewStatus);

				if (reviewStatus === 'ACCEPTED') {
					const report = await findPostCollectionReportById(reportId);
					if (report?.postCollectionId) {
						await updateCollectionModerationStatus(report.postCollectionId, 'FLAGGED');
					}
				}

				return createSuccessResponse(
					'api-route',
					'Successfully updated the collection report status.',
					updatedReport,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while updating the collection report status.',
				);
			}
		},
		true,
	);
};
