import { handleGetSelfData } from '$lib/server/controllers/users';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetSelfData(request)) as ReturnType<RequestHandler>;
};
