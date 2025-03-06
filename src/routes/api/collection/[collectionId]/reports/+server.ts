import {
	handleCreatePostCollectionReport,
	handleDeletePostCollectionReport,
	handleGetPostCollectionReports,
} from '$lib/server/controllers/collectionReports';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetPostCollectionReports(request, 'api-route')) as ReturnType<RequestHandler>;
};

export const POST: RequestHandler = async (request) => {
	return (await handleCreatePostCollectionReport(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeletePostCollectionReport(request)) as ReturnType<RequestHandler>;
};
