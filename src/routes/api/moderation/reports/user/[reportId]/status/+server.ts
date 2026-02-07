import { handleUpdateUserReportStatus } from '$lib/server/controllers/userReports';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async (event) => {
	return (await handleUpdateUserReportStatus(event)) as ReturnType<RequestHandler>;
};
