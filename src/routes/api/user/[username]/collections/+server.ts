import { handleGetUserCollections } from '$lib/server/controllers/collections';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	return (await handleGetUserCollections(event, 'api-route')) as ReturnType<RequestHandler>;
};
