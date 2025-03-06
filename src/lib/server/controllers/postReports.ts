import type { RequestEvent } from '@sveltejs/kit';
import { findPostById } from '../db/actions/post';
import {
	createPostReport,
	deletePostReportByIds,
	findPostReportsFromPostId,
	findPostReportsViaPagination,
} from '../db/actions/postReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import type { TControllerHandlerVariant } from '../types/controllers';
import { handleModerationRoleCheck } from './reports';
import {
	CreatePostReportSchema,
	DeletePostReportSchema,
	GetPostReportsSchema,
	GetPostsReportsSchema,
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
				const moderationFailureResponse = await handleModerationRoleCheck(event, handlerType);
				if (moderationFailureResponse) return moderationFailureResponse;

				const post = await findPostById(postId, { id: true });
				if (!post) {
					return createErrorResponse(
						handlerType,
						404,
						'The post you are trying to fetch reports for does not exist.',
					);
				}

				const postReports = await findPostReportsFromPostId(postId);
				return createSuccessResponse(handlerType, 'Successfully fetched the post reports.', {
					postReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
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

export const handleGetPostsReportsGeneral = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetPostsReportsSchema,
		async (data) => {
			const { pageNumber, reviewStatus, category } = data.urlSearchParams;
			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const postReports = await findPostReportsViaPagination(pageNumber, reviewStatus, category);
				return createSuccessResponse('api-route', 'Successfully fetched the post reports.', {
					postReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching the post reports',
				);
			}
		},
		true,
	);
};
