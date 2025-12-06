import { handleGetPostSources } from '$lib/server/controllers/postSources';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

export const GET = async (event: RequestEvent) => {
	return (await handleGetPostSources(event)) as ReturnType<RequestHandler>;
};
