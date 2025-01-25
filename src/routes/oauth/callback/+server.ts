import { handleOauthChallenge, handleOauthStorage } from '$lib/server/controllers/oauth';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (request) => {
	return (await handleOauthStorage(request)) as ReturnType<RequestHandler>;
};

export const GET: RequestHandler = async (request) => {
	return (await handleOauthChallenge(request)) as ReturnType<RequestHandler>;
};
