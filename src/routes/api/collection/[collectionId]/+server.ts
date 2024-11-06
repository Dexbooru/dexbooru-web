import {
	handleDeleteCollection,
	handleGetCollection,
	handleUpdateCollection,
} from '$lib/server/controllers/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetCollection(request, 'api-route')) as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (request) => {
	return (await handleUpdateCollection(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeleteCollection(request)) as ReturnType<RequestHandler>;
};
