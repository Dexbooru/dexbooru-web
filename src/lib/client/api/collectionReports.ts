import type { PostCollectionReportCategory } from '$generated/prisma/browser';
import { createReportClientApi } from './reportClient';

const collectionReportClient = createReportClientApi<PostCollectionReportCategory>({
	createPath: (collectionId) => `/api/collection/${collectionId}/reports`,
	getByTargetPath: (collectionId) => `/api/collection/${collectionId}/reports`,
	deletePath: (collectionId, reportId) =>
		`/api/collection/${collectionId}/reports?reportId=${reportId}`,
	listGeneralPath: (pageNumber) => `/api/collections/reports?pageNumber=${pageNumber}`,
});

export const createPostCollectionReport = collectionReportClient.createReport;
export const getPostCollectionReports = collectionReportClient.getReportsByTarget;
export const deletePostCollectionReport = collectionReportClient.deleteReport;
export const getCollectionsReports = collectionReportClient.getReportsGeneral;
