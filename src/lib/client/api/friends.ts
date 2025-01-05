import { buildUrl } from '$lib/client/helpers/urls';
import type { TFriendRequestHandleBody } from '$lib/shared/types/friends';

export const addFriend = async (username: string): Promise<Response> => {
	return await fetch(`/api/user/${username}/friend-requests`, {
		method: 'POST',
	});
};

export const handleFriendRequest = async (
	username: string,
	body: TFriendRequestHandleBody,
): Promise<Response> => {
	const url = buildUrl(`/api/user/${username}/friend-requests`, { action: body.action });
	return await fetch(url, {
		method: 'DELETE',
	});
};

export const deleteFriend = async (username: string): Promise<Response> => {
	return await fetch(`/api/user/${username}/friends`, {
		method: 'DELETE',
	});
};
