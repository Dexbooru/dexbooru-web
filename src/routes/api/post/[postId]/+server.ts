import {
	handleCreatePost,
	handleDeletePost,
	handleGetPost,
	handleUpdatePost,
} from '$lib/server/controllers/posts';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (request) => {
	const response = await handleCreatePost(request, 'api-route');
	return response as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (request) => {
	return (await handleUpdatePost(request, 'api-route')) as ReturnType<RequestHandler>;
};

export const GET: RequestHandler = async (request) => {
	const response = await handleGetPost(request, 'api-route');
	return response as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	const response = handleDeletePost(request);
	return response as ReturnType<RequestHandler>;
};
