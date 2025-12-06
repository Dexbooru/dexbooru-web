import type { PostReportCategory } from '$generated/prisma/browser';
import { getApiAuthHeaders } from '../helpers/auth';

export const createPostReport = async (
	postId: string,
	reportReasonCategory: PostReportCategory,
	description: string,
) => {
	return await fetch(`/api/post/${postId}/reports`, {
		method: 'POST',
		body: JSON.stringify({ category: reportReasonCategory, description }),
	});
};

export const getPostsReports = async (pageNumber: number) => {
	const url = `/api/posts/reports?pageNumber=${pageNumber}`;
	return await fetch(url, {
		headers: getApiAuthHeaders(),
		method: 'GET',
	});
};

export const getPostReports = async (postId: string) => {
	return await fetch(`/api/post/${postId}/reports`, {
		headers: getApiAuthHeaders(),
		method: 'GET',
	});
};

export const deletePostReport = async (postId: string, reportId: string) => {
	return await fetch(`/api/post/${postId}/reports?reportId=${reportId}`, {
		headers: getApiAuthHeaders(),
		method: 'DELETE',
	});
};
