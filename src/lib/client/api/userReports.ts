import type { UserReportCategory } from '$generated/prisma/browser';
import { getApiAuthHeaders } from '../helpers/auth';

export const createUserReport = async (
	username: string,
	reportReasonCategory: UserReportCategory,
	description: string,
) => {
	return await fetch(`/api/user/${username}/reports`, {
		method: 'POST',
		body: JSON.stringify({ category: reportReasonCategory, description }),
	});
};

export const getUserReports = async (username: string) => {
	return await fetch(`/api/user/${username}/reports`, {
		headers: getApiAuthHeaders(),
		method: 'GET',
	});
};

export const deleteUserReport = async (username: string, reportId: string) => {
	return await fetch(`/api/user/${username}/reports?reportId=${reportId}`, {
		headers: getApiAuthHeaders(),
		method: 'DELETE',
	});
};

export const getUsersReports = async (pageNumber: number) => {
	const url = `/api/users/reports?pageNumber=${pageNumber}`;
	return await fetch(url, {
		headers: getApiAuthHeaders(),
		method: 'GET',
	});
};
