import { handleDeleteFriend } from '$lib/server/controllers/friends';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeleteFriend(request)) as ReturnType<RequestHandler>;
};
