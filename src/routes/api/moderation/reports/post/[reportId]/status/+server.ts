import { handleUpdatePostReportStatus } from '$lib/server/controllers/postReports';
import type { RequestHandler } from '@sveltejs/kit';

export const PATCH: RequestHandler = async (event) => {
	return (await handleUpdatePostReportStatus(event)) as ReturnType<RequestHandler>;
};
