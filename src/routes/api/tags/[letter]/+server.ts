import { handleGetTags } from '$lib/server/controllers/tags';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetTags(request)) as ReturnType<RequestHandler>;
};
