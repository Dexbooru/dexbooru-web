import {
	handleCreatePostReport,
	handleDeletePostReport,
	handleGetPostReports,
} from '$lib/server/controllers/postReports';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetPostReports(request, 'api-route')) as ReturnType<RequestHandler>;
};

export const POST: RequestHandler = async (request) => {
	return (await handleCreatePostReport(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeletePostReport(request)) as ReturnType<RequestHandler>;
};
