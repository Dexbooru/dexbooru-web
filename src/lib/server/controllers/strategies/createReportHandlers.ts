import type { ModerationReportStatus } from '$generated/prisma/client';
import type { RequestEvent } from '@sveltejs/kit';
import {
	createErrorResponse,
	createSuccessResponse,
	validateAndHandleRequest,
} from '../../helpers/controllers';
import logger from '../../logging/logger';
import type { TControllerHandlerVariant } from '../../types/controllers';
import { handleModerationRoleCheck } from '../reports';
import type { TReportHandlers, TReportStrategy } from './types';

export function createReportHandlers<TReport, TCategory>(
	strategy: TReportStrategy<TReport, TCategory>,
): TReportHandlers {
	const handleCreate = async (event: RequestEvent) => {
		return await validateAndHandleRequest(
			event,
			'api-route',
			strategy.schemas.create,
			async (data) => {
				const pathParams = data.pathParams as Record<string, string>;
				const { description, category } = data.body as {
					description?: string | null;
					category: TCategory;
				};

				try {
					const target = await strategy.resolveCreateTarget(pathParams);
					if (!target) {
						return createErrorResponse('api-route', 404, strategy.missingTargetMessage('create'));
					}

					const createdReport = await strategy.create({
						description,
						category,
						targetId: target.id,
					});

					return createSuccessResponse(
						'api-route',
						`Successfully created the ${strategy.entityLabel} report.`,
						{ [strategy.responseCreatedKey]: createdReport },
						201,
					);
				} catch (error) {
					logger.error(error);

					return createErrorResponse(
						'api-route',
						500,
						`An unexpected error occurred while creating the ${strategy.entityLabel} report.`,
					);
				}
			},
		);
	};

	const handleGetByTarget = async (event: RequestEvent, handlerType: TControllerHandlerVariant) => {
		return await validateAndHandleRequest(
			event,
			handlerType,
			strategy.schemas.getByTarget,
			async (data) => {
				const pathParams = data.pathParams as Record<string, string>;

				try {
					const moderationFailureResponse = await handleModerationRoleCheck(event, handlerType);
					if (moderationFailureResponse) return moderationFailureResponse;

					const target = await strategy.resolveGetTarget(pathParams);
					if (!target) {
						return createErrorResponse(handlerType, 404, strategy.missingTargetMessage('get'));
					}

					const reports = await strategy.findByTargetId(target.id);
					return createSuccessResponse(
						handlerType,
						`Successfully fetched the ${strategy.entityLabel} reports.`,
						{ [strategy.responseCollectionKey]: reports },
					);
				} catch (error) {
					logger.error(error);

					return createErrorResponse(
						handlerType,
						500,
						`An unexpected error occurred while fetching the ${strategy.entityLabel} reports.`,
					);
				}
			},
			true,
		);
	};

	const handleGetGeneral = async (event: RequestEvent) => {
		return await validateAndHandleRequest(
			event,
			'api-route',
			strategy.schemas.getGeneral,
			async (data) => {
				const { pageNumber, reviewStatus, category } = data.urlSearchParams as {
					pageNumber: number;
					reviewStatus: ModerationReportStatus;
					category?: TCategory;
				};

				try {
					const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
					if (moderationFailureResponse) return moderationFailureResponse;

					const reports = await strategy.findPaginated(pageNumber, reviewStatus, category);
					return createSuccessResponse(
						'api-route',
						`Successfully fetched the ${strategy.entityLabel} reports.`,
						{ [strategy.responseCollectionKey]: reports },
					);
				} catch (error) {
					logger.error(error);

					return createErrorResponse(
						'api-route',
						500,
						`An unexpected error occurred while fetching the ${strategy.entityLabel} reports`,
					);
				}
			},
			true,
		);
	};

	const handleDelete = async (event: RequestEvent) => {
		return await validateAndHandleRequest(
			event,
			'api-route',
			strategy.schemas.delete,
			async (data) => {
				const pathParams = data.pathParams as Record<string, string>;
				const reportId = (data.urlSearchParams as { reportId: string }).reportId;

				try {
					const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
					if (moderationFailureResponse) return moderationFailureResponse;

					const target = await strategy.resolveDeleteTarget(pathParams);
					if (!target) {
						return createErrorResponse('api-route', 404, strategy.missingTargetMessage('delete'));
					}

					const deletedReport = await strategy.deleteByIds(target.id, reportId);

					return createSuccessResponse(
						'api-route',
						`Successfully deleted the ${strategy.entityLabel} report.`,
						deletedReport,
					);
				} catch (error) {
					logger.error(error);

					// Prisma throws when the report row is missing; map that to a 404-friendly message.
					return createErrorResponse(
						'api-route',
						500,
						`An unexpected error occurred while deleting the ${strategy.entityLabel} report.`,
					);
				}
			},
			true,
		);
	};

	const handleUpdateStatus = async (event: RequestEvent) => {
		return await validateAndHandleRequest(
			event,
			'api-route',
			strategy.schemas.updateStatus,
			async (data) => {
				const { reportId } = data.pathParams as { reportId: string };
				const { reviewStatus } = data.body as { reviewStatus: ModerationReportStatus };

				try {
					const moderationFailureResponse = await handleModerationRoleCheck(event, 'api-route');
					if (moderationFailureResponse) return moderationFailureResponse;

					const updatedReport = await strategy.updateStatus(reportId, reviewStatus);
					await strategy.onStatusUpdated?.(reportId, reviewStatus, updatedReport);

					return createSuccessResponse(
						'api-route',
						`Successfully updated the ${strategy.entityLabel} report status.`,
						updatedReport,
					);
				} catch (error) {
					logger.error(error);

					return createErrorResponse(
						'api-route',
						500,
						`An unexpected error occurred while updating the ${strategy.entityLabel} report status.`,
					);
				}
			},
			true,
		);
	};

	return {
		handleCreate,
		handleGetByTarget,
		handleGetGeneral,
		handleDelete,
		handleUpdateStatus,
	};
}
