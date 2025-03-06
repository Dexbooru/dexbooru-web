import { handleGetModerators } from '$lib/server/controllers/moderation';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetModerators(request)) as ReturnType<RequestHandler>;
};
