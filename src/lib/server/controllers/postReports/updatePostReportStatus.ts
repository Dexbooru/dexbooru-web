import { updatePostReportStatus } from '../../db/actions/postReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { handleModerationRoleCheck } from '../reports';
import { UpdatePostReportStatusSchema } from '../request-schemas/postReports';
import type { RequestEvent } from '@sveltejs/kit';

export const handleUpdatePostReportStatus = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UpdatePostReportStatusSchema,
		async (data) => {
			const { reportId } = data.pathParams;
			const { reviewStatus } = data.body;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const updatedReport = await updatePostReportStatus(reportId, reviewStatus);
				return createSuccessResponse(
					'api-route',
					'Successfully updated the post report status.',
					updatedReport,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while updating the post report status.',
				);
			}
		},
		true,
	);
};
