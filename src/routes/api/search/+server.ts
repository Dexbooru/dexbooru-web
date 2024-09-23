import { getSearchResults } from '$lib/server/controllers/search';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return await getSearchResults(request) as ReturnType<RequestHandler>;
};
