import { handleGetPostCollectionsReportsGeneral } from '$lib/server/controllers/collectionReports';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetPostCollectionsReportsGeneral(request)) as ReturnType<RequestHandler>;
};
