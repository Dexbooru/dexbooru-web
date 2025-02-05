import { handleGetPostCollections } from '$lib/server/controllers/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetPostCollections(request, 'api-route')) as ReturnType<RequestHandler>;
};
