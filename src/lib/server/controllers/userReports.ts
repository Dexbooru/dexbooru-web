import { UUID_REGEX } from '$lib/shared/constants/search';
import type { RequestEvent } from '@sveltejs/kit';
import { findUserById, findUserByName } from '../db/actions/user';
import {
	createUserReport,
	deleteUserReportByIds,
	findUserReportsFromUserId,
	findUserReportsViaPagination,
} from '../db/actions/userReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import type { TControllerHandlerVariant } from '../types/controllers';
import { handleModerationRoleCheck } from './reports';
import {
	CreateUserReportSchema,
	DeleteUserReportSchema,
	GetUserReportsSchema,
	GetUsersReportsSchema,
} from './request-schemas/userReports';

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

export const handleGetUserReports = async (
	event: RequestEvent,
	handlerType: TControllerHandlerVariant,
) => {
	return await validateAndHandleRequest(
		event,
		handlerType,
		GetUserReportsSchema,
		async (data) => {
			const username = data.pathParams.username;

			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, handlerType);
				if (moderationFailureResponse) return moderationFailureResponse;

				const dbFindFn = UUID_REGEX.test(username) ? findUserById : findUserByName;
				const user = await dbFindFn(username, { id: true });
				if (!user) {
					return createErrorResponse(
						handlerType,
						404,
						'The user you are trying to fetch reports for does not exist.',
					);
				}

				const userReports = await findUserReportsFromUserId(user.id);
				return createSuccessResponse(handlerType, 'Successfully fetched the user reports.', {
					userReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					handlerType,
					500,
					'An unexpected error occurred while fetching the user reports.',
				);
			}
		},
		true,
	);
};

export const handleCreateUserReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreateUserReportSchema,
		async (data) => {
			const username = data.pathParams.username;
			const { description, category } = data.body;

			try {
				const user = await findUserByName(username, { id: true });
				if (!user) {
					return createErrorResponse(
						'api-route',
						404,
						'The user you are trying to report does not exist.',
					);
				}

				const newUserReport = await createUserReport({
					description,
					category,
					userId: user.id,
				});

				return createSuccessResponse(
					'api-route',
					'Successfully created the user report.',
					{ newUserReport },
					201,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while creating the user report.',
				);
			}
		},
	);
};

export const handleGetUserReportsGeneral = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetUsersReportsSchema,
		async (data) => {
			const { pageNumber, category, reviewStatus } = data.urlSearchParams;
			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const userReports = await findUserReportsViaPagination(pageNumber, reviewStatus, category);
				return createSuccessResponse('api-route', 'Successfully fetched the user reports.', {
					userReports,
				});
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching the user reports',
				);
			}
		},
		true,
	);
};
