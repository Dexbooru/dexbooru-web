import { handleGetCommentChain } from '$lib/server/controllers/comments';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetCommentChain(request)) as ReturnType<RequestHandler>;
};
