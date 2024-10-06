import { handleUserOauth2AuthFlowEndpoint } from '$lib/server/controllers/users';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (request) => {
	return (await handleUserOauth2AuthFlowEndpoint(request)) as ReturnType<RequestHandler>;
};
