import { handleLikePost } from '$lib/server/controllers/posts';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async (event) => {
	return (await handleLikePost(event)) as ReturnType<RequestHandler>;
};
