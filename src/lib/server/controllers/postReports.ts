import type { RequestEvent } from '@sveltejs/kit';
import {
	createPostReport,
	deletePostReportByIds,
	findPostReportsFromPostId,
} from '../db/actions/postReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import type { TControllerHandlerVariant } from '../types/controllers';
import {
	CreatePostReportSchema,
	DeletePostReportSchema,
	GetPostReportsSchema,
} from './request-schemas/postReports';

export const handleDeletePostReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		DeletePostReportSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const reportId = data.urlSearchParams.reportId;

			try {
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
				const postReports = await findPostReportsFromPostId(postId);
				return createSuccessResponse(handlerType, 'Successfully fetched the post reports.', {
					postReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching the post reports.',
				);
			}
		},
		true,
	);
};

export const handleCreatePostReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreatePostReportSchema,
		async (data) => {
			const postId = data.pathParams.postId;
			const { description, category } = data.body;

			try {
				const newPostReport = await createPostReport({
					description,
					category,
					postId,
				});

				return createSuccessResponse(
					'api-route',
					'Successfully created the post report.',
					{ newPostReport },
					201,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occcured while creating the post report.',
				);
			}
		},
	);
};
