import type { UserReportCategory } from '$generated/prisma/browser';
import { createReportClientApi } from './reportClient';

const userReportClient = createReportClientApi<UserReportCategory>({
	createPath: (username) => `/api/user/${username}/reports`,
	getByTargetPath: (username) => `/api/user/${username}/reports`,
	deletePath: (username, reportId) => `/api/user/${username}/reports?reportId=${reportId}`,
	listGeneralPath: (pageNumber) => `/api/users/reports?pageNumber=${pageNumber}`,
});

export const createUserReport = userReportClient.createReport;
export const getUserReports = userReportClient.getReportsByTarget;
export const deleteUserReport = userReportClient.deleteReport;
export const getUsersReports = userReportClient.getReportsGeneral;
