import { handleGetUserReportsGeneral } from '$lib/server/controllers/userReports';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetUserReportsGeneral(request)) as ReturnType<RequestHandler>;
};
