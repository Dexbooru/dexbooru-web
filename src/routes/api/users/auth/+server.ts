import {
	handleUserAuthFlowEndpoint,
	handleUserAuthFlowValidate,
} from '$lib/server/controllers/users';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleUserAuthFlowValidate(request)) as ReturnType<RequestHandler>;
};

export const POST: RequestHandler = async (request) => {
	return (await handleUserAuthFlowEndpoint(request)) as ReturnType<RequestHandler>;
};
