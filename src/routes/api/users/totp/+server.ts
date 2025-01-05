import { handleGenerateUserTotpData } from '$lib/server/controllers/users';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (request) => {
	return (await handleGenerateUserTotpData(request)) as ReturnType<RequestHandler>;
};
