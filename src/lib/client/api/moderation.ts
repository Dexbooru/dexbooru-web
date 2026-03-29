import type {
	CollectionModerationStatus,
	ModerationReportStatus,
	PostModerationStatus,
	UserModerationStatus,
} from '$generated/prisma/browser';
import { getApiAuthHeaders } from '../helpers/auth';

export type TOwnerAmendResourceModerationBody =
	| { resourceType: 'post'; resourceId: string; status: PostModerationStatus }
	| { resourceType: 'user'; resourceId: string; status: UserModerationStatus }
	| { resourceType: 'postCollection'; resourceId: string; status: CollectionModerationStatus };

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
		method: 'PATCH',
		headers: {
			...getApiAuthHeaders(),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ status }),
	});
};

const OWNER_RESOURCE_MODERATION_STATUS_URL = '/api/moderation/owner/resource-moderation-status';

export const getOwnerResourceModerationStatus = async (
	resourceType: 'post' | 'user' | 'postCollection',
	resourceId: string,
) => {
	const params = new URLSearchParams({ resourceType, resourceId });
	return await fetch(`${OWNER_RESOURCE_MODERATION_STATUS_URL}?${params}`, {
		method: 'GET',
		headers: getApiAuthHeaders(),
	});
};

export const ownerAmendResourceModeration = async (body: TOwnerAmendResourceModerationBody) => {
	return await fetch(OWNER_RESOURCE_MODERATION_STATUS_URL, {
		method: 'PATCH',
		headers: {
			...getApiAuthHeaders(),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
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
		method: 'PATCH',
		headers: {
			...getApiAuthHeaders(),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ reviewStatus: status }),
	});
};
