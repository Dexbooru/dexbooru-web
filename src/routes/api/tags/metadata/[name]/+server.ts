import { getLabelMetadata, updateLabelMetadata } from '$lib/server/controllers/labels';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await getLabelMetadata(request, 'tag')) as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (request) => {
	return (await updateLabelMetadata(request, 'tag')) as ReturnType<RequestHandler>;
};
