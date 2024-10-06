import { handleFriendRequest, handleSendFriendRequest } from '$lib/server/controllers/friends';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (request) => {
	return (await handleSendFriendRequest(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleFriendRequest(request)) as ReturnType<RequestHandler>;
};
