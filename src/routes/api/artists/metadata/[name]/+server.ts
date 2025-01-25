import { handleGetLabelMetadata, handleUpdateLabelMetadata } from '$lib/server/controllers/labels';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetLabelMetadata(request, 'artist')) as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (request) => {
	return (await handleUpdateLabelMetadata(request, 'artist')) as ReturnType<RequestHandler>;
};
