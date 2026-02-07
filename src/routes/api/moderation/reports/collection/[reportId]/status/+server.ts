import { handleUpdatePostCollectionReportStatus } from '$lib/server/controllers/collectionReports';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async (event) => {
	return (await handleUpdatePostCollectionReportStatus(event)) as ReturnType<RequestHandler>;
};
