import { handleUpdatePostReportStatus } from '$lib/server/controllers/postReports';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async (event) => {
	return (await handleUpdatePostReportStatus(event)) as ReturnType<RequestHandler>;
};
