import type { RequestEvent } from '@sveltejs/kit';
import { findCollectionById } from '../db/actions/collection';
import {
	createPostCollectionReport,
	deletePostCollectionReportByIds,
	findPostCollectionReportsFromCollectionId,
	findPostCollectionsReportsViaPagination,
} from '../db/actions/collectionReport';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../helpers/controllers';
import logger from '../logging/logger';
import type { TControllerHandlerVariant } from '../types/controllers';
import { handleModerationRoleCheck } from './reports';
import {
	CreatePostCollectionReportSchema,
	DeletePostCollectionReportSchema,
	GetPostCollectionReportsSchema,
	GetPostCollectionsReportsSchema,
} from './request-schemas/collectionReports';

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

export const handleCreatePostCollectionReport = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		CreatePostCollectionReportSchema,
		async (data) => {
			const collectionId = data.pathParams.collectionId;
			const { description, category } = data.body;

			try {
				const collection = await findCollectionById(collectionId, { id: true });
				if (!collection) {
					return createErrorResponse(
						'api-route',
						404,
						'The post collection you are trying to report does not exist.',
					);
				}

				const newPostCollectionReport = await createPostCollectionReport({
					description,
					category,
					postCollectionId: collection.id,
				});

				return createSuccessResponse(
					'api-route',
					'Successfully created the post collection report.',
					{ newPostCollectionReport },
					201,
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while creating the post collection report.',
				);
			}
		},
	);
};

export const handleGetPostCollectionsReportsGeneral = async (event: RequestEvent) => {
	return await validateAndHandleRequest(
		event,
		'api-route',
		GetPostCollectionsReportsSchema,
		async (data) => {
			const { pageNumber, reviewStatus, category } = data.urlSearchParams;
			try {
				const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
				if (moderationFailureResponse) return moderationFailureResponse;

				const postCollectionReports = await findPostCollectionsReportsViaPagination(
					pageNumber,
					reviewStatus,
					category,
				);
				return createSuccessResponse(
					'api-route',
					'Successfully fetched the post collection reports.',
					{
						postCollectionReports,
					},
				);
			} catch (error) {
				logger.error(error);

				return createErrorResponse(
					'api-route',
					500,
					'An unexpected error occurred while fetching the post collection reports',
				);
			}
		},
		true,
	);
};
