import { handleUpdateCollectionsPosts } from '$lib/server/controllers/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async (request) => {
	return (await handleUpdateCollectionsPosts(request)) as ReturnType<RequestHandler>;
};
