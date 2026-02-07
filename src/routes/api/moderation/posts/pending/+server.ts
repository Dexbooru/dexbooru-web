import { handleGetPendingPosts } from '$lib/server/controllers/moderation';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	return (await handleGetPendingPosts(event)) as ReturnType<RequestHandler>;
};
