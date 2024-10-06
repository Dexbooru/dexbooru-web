import { buildUrl } from '$lib/shared/helpers/urls';
import type { IFriendRequestHandleBody } from '$lib/shared/types/friends';
import { getApiAuthHeaders } from '../helpers/auth';

export const addFriend = async (username: string): Promise<Response> => {
	return await fetch(`/api/user/${username}/friend-requests`, {
		method: 'POST',
		headers: getApiAuthHeaders(),
	});
};

export const handleFriendRequest = async (
	username: string,
	body: IFriendRequestHandleBody,
): Promise<Response> => {
	const url = buildUrl(`/api/user/${username}/friend-requests`, { action: body.action });
	return await fetch(url, {
		method: 'DELETE',
		headers: getApiAuthHeaders(),
	});
};

export const deleteFriend = async (username: string): Promise<Response> => {
	return await fetch(`/api/user/${username}/friends`, {
		method: 'DELETE',
		headers: getApiAuthHeaders(),
	});
};
