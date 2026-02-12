import type { RequestEvent } from '@sveltejs/kit';
import { findUserReportById, updateUserReportStatus } from '../../db/actions/userReport';
import { updateUserModerationStatus } from '../../db/actions/user';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { handleModerationRoleCheck } from '../reports';
import { UpdateUserReportStatusSchema } from '../request-schemas/userReports';

export const handleUpdateUserReportStatus = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		UpdateUserReportStatusSchema,
		async (data) => {
			const { reportId } = data.pathParams;
			const { reviewStatus } = data.body;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const updatedReport = await updateUserReportStatus(reportId, reviewStatus);

				if (reviewStatus === 'ACCEPTED') {
					const report = await findUserReportById(reportId);
					if (report?.userId) {
						await updateUserModerationStatus(report.userId, 'FLAGGED');
					}
				}

				return createSuccessResponse(
					'api-route',
					'Successfully updated the user report status.',
					updatedReport,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while updating the user report status.',
				);
			}
		},
		true,
	);
};
