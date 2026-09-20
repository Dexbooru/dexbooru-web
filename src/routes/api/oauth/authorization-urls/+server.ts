import { handleGetOauthAuthorizationUrls } from '$lib/server/controllers/oauth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	return (await handleGetOauthAuthorizationUrls(event)) as ReturnType<RequestHandler>;
};
