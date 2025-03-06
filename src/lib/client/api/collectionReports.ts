import type { PostCollectionReportCategory } from '@prisma/client';
import { getApiAuthHeaders } from '../helpers/auth';

export const createPostCollectionReport = async (
	collectionId: string,
	reportReasonCategory: PostCollectionReportCategory,
	description: string,
) => {
	return await fetch(`/api/collection/${collectionId}/reports`, {
		method: 'POST',
		body: JSON.stringify({ category: reportReasonCategory, description }),
	});
};

export const getPostCollectionReports = async (collectionId: string) => {
	return await fetch(`/api/collection/${collectionId}/reports`, {
		headers: getApiAuthHeaders(),
		method: 'GET',
	});
};

export const deletePostCollectionReport = async (collectionId: string, reportId: string) => {
	return await fetch(`/api/collection/${collectionId}/reports?reportId=${reportId}`, {
		headers: getApiAuthHeaders(),
		method: 'DELETE',
	});
};

export const getCollectionsReports = async (pageNumber: number) => {
	const url = `/api/collections/reports?pageNumber=${pageNumber}`;
	return await fetch(url, {
		headers: getApiAuthHeaders(),
		method: 'GET',
	});
};
