import { handleGetSearchResults } from '$lib/server/controllers/search';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetSearchResults(request)) as ReturnType<RequestHandler>;
};
