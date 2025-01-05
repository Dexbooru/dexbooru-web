import {
	handleCreatePostComment,
	handleDeletePostComments,
	handleEditPostComments,
	handleGetPostComments,
} from '$lib/server/controllers/comments';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetPostComments(request)) as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (request) => {
	return (await handleEditPostComments(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeletePostComments(request)) as ReturnType<RequestHandler>;
};

export const POST: RequestHandler = async (request) => {
	return (await handleCreatePostComment(request)) as ReturnType<RequestHandler>;
};
