import { getLabelMetadata, updateLabelMetadata } from '$lib/server/controllers/labels';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await getLabelMetadata(request, 'artist')) as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (request) => {
	return (await updateLabelMetadata(request, 'artist')) as ReturnType<RequestHandler>;
};
