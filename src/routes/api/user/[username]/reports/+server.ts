import {
	handleCreateUserReport,
	handleDeleteUserReport,
	handleGetUserReports,
} from '$lib/server/controllers/userReports';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetUserReports(request, 'api-route')) as ReturnType<RequestHandler>;
};

export const POST: RequestHandler = async (request) => {
	return (await handleCreateUserReport(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeleteUserReport(request)) as ReturnType<RequestHandler>;
};
