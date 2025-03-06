import { handleGetPostsReportsGeneral } from '$lib/server/controllers/postReports';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetPostsReportsGeneral(request)) as ReturnType<RequestHandler>;
};
