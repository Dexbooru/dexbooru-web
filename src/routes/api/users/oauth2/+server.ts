import {
	handleUserOauth2AuthFlowEndpoint,
	handleUserOauth2AuthFlowValidate,
} from '$lib/server/controllers/users';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleUserOauth2AuthFlowValidate(request)) as ReturnType<RequestHandler>;
};

export const POST: RequestHandler = async (request) => {
	return (await handleUserOauth2AuthFlowEndpoint(request)) as ReturnType<RequestHandler>;
};
