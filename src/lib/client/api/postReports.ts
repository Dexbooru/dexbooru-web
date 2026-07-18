import type { PostReportCategory } from '$generated/prisma/browser';
import { createReportClientApi } from './reportClient';

const postReportClient = createReportClientApi<PostReportCategory>({
	createPath: (postId) => `/api/post/${postId}/reports`,
	getByTargetPath: (postId) => `/api/post/${postId}/reports`,
	deletePath: (postId, reportId) => `/api/post/${postId}/reports?reportId=${reportId}`,
	listGeneralPath: (pageNumber) => `/api/posts/reports?pageNumber=${pageNumber}`,
});

export const createPostReport = postReportClient.createReport;
export const getPostReports = postReportClient.getReportsByTarget;
export const deletePostReport = postReportClient.deleteReport;
export const getPostsReports = postReportClient.getReportsGeneral;
