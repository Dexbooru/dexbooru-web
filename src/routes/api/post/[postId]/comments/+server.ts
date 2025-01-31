import {
	handleCreatePostComment,
	handleDeletePostComment,
	handleGetPostComments,
	handleUpdatePostComment,
} from '$lib/server/controllers/comments';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetPostComments(request)) as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (request) => {
	return (await handleUpdatePostComment(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeletePostComment(request)) as ReturnType<RequestHandler>;
};

export const POST: RequestHandler = async (request) => {
	return (await handleCreatePostComment(request)) as ReturnType<RequestHandler>;
};
