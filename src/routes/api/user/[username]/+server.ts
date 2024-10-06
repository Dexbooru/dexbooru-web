import { handleGetUser } from '$lib/server/controllers/users';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetUser(request, 'api-route')) as ReturnType<RequestHandler>;
};
