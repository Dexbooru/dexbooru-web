import type { ModerationReportStatus, PostModerationStatus } from '$generated/prisma/browser';
import { getApiAuthHeaders } from '../helpers/auth';

export const getModerators = async () => {
	return await fetch('/api/moderators', {
		method: 'GET',
		headers: getApiAuthHeaders(),
	});
};

export const getPendingPosts = async (pageNumber: number) => {
	return await fetch(`/api/moderation/posts/pending?pageNumber=${pageNumber}`, {
		method: 'GET',
		headers: getApiAuthHeaders(),
	});
};

export const updatePostModerationStatus = async (postId: string, status: PostModerationStatus) => {
	return await fetch(`/api/moderation/posts/${postId}/status`, {
		method: 'PUT',
		headers: {
			...getApiAuthHeaders(),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ status }),
	});
};

export const updateReportStatus = async (
	reportId: string,
	reportType: 'postReports' | 'postCollectionReports' | 'userReports',
	status: ModerationReportStatus,
) => {
	const typeMap = {
		postReports: 'post',
		postCollectionReports: 'collection',
		userReports: 'user',
	};

	return await fetch(`/api/moderation/reports/${typeMap[reportType]}/${reportId}/status`, {
		method: 'PUT',
		headers: {
			...getApiAuthHeaders(),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ reviewStatus: status }),
	});
};
