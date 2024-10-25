import { handleCreateCollection } from '$lib/server/controllers/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (request) => {
	return (await handleCreateCollection(request, 'api-route')) as ReturnType<RequestHandler>;
};
