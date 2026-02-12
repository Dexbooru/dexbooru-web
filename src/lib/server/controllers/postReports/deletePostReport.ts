import { deletePostReportByIds } from '../../db/actions/postReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import { handleModerationRoleCheck } from '../reports';
import { DeletePostReportSchema } from '../request-schemas/postReports';
import type { RequestEvent } from '@sveltejs/kit';

export const handleDeletePostReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeletePostReportSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const reportId = data.urlSearchParams.reportId;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const deletedPostReport = await deletePostReportByIds(postId, reportId);
				if (!deletedPostReport) {
					return createErrorResponse(
						'api-route',
						404,
						'The post report you are trying to delete does not exist.',
					);
				}

				return createSuccessResponse(
					'api-route',
					'Successfully deleted the post report.',
					deletedPostReport,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while deleting the post report.',
				);
			}
		},
		true,
	);
};
