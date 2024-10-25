import {
	handleDeleteCollection,
	handleUpdateCollection,
} from '$lib/server/controllers/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async (request) => {
	return (await handleUpdateCollection(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeleteCollection(request)) as ReturnType<RequestHandler>;
};
