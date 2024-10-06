import { handleGetPostsByAuthor } from '$lib/server/controllers/posts';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetPostsByAuthor(request, 'api-route')) as ReturnType<RequestHandler>;
};
