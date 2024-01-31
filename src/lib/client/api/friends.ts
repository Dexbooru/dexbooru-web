import type {
	IFriendRemoveBody,
	IFriendRequestHandleBody,
	IFriendRequestSendBody
} from '$lib/shared/types/friends';

export const addFriend = async (body: IFriendRequestSendBody): Promise<Response> => {
	return await fetch('/api/auth/friends/requests/send', {
		method: 'POST',
		body: JSON.stringify(body)
	});
};

export const handleFriendRequest = async (body: IFriendRequestHandleBody): Promise<Response> => {
	return await fetch('/api/auth/friends/requests/handle', {
		method: 'POST',
		body: JSON.stringify(body)
	});
};

export const deleteFriend = async (body: IFriendRemoveBody): Promise<Response> => {
	return await fetch('/api/auth/friends/remove', {
		method: 'POST',
		body: JSON.stringify(body)
	});
};
