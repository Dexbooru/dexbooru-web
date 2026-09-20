import { handleGetUserTotp } from '$lib/server/controllers/users';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	return (await handleGetUserTotp(event, 'api-route')) as ReturnType<RequestHandler>;
};
