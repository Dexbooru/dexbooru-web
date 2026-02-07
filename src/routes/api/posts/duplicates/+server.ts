import { handleCheckForDuplicatePosts } from '$lib/server/controllers/posts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	return (await handleCheckForDuplicatePosts(event, 'api-route')) as Response;
};
