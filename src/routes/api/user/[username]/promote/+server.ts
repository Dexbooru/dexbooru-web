import { handleUpdateUserRole } from '$lib/server/controllers/users';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async (request) => {
	return (await handleUpdateUserRole(request)) as ReturnType<RequestHandler>;
};
