import type { RequestEvent } from '@sveltejs/kit';
import { findUserByName } from '../../db/actions/user';
import { deleteUserReportByIds } from '../../db/actions/userReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { handleModerationRoleCheck } from '../reports';
import { DeleteUserReportSchema } from '../request-schemas/userReports';

export const handleDeleteUserReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeleteUserReportSchema,
		async (data) => {
			const username = data.pathParams.username;
			const reportId = data.urlSearchParams.reportId;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const user = await findUserByName(username, { id: true });
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						'The user you are trying to delete a report for does not exist.',
					);
				}

				const deletedUserReport = await deleteUserReportByIds(user.id, reportId);
				if (!deletedUserReport) {
					return createErrorResponse(
						'api-route',
						404,
						'The user report you are trying to delete does not exist.',
					);
				}

				return createSuccessResponse(
					'api-route',
					'Successfully deleted the user report.',
					deletedUserReport,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while deleting the user report.',
				);
			}
		},
		true,
	);
};
