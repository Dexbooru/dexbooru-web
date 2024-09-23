import { handleGetArtists } from '$lib/server/controllers/artists';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return await handleGetArtists(request) as ReturnType<RequestHandler>;
}