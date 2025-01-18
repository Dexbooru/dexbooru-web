import { handleOauthChallenge } from '$lib/server/controllers/oauth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleOauthChallenge(request)) as ReturnType<RequestHandler>;
};
