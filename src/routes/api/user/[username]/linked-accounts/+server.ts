import {
	handleGetUserLinkedAccounts,
	handleUpdateLinkedAccounts,
} from '$lib/server/controllers/linkedAccounts';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetUserLinkedAccounts(request)) as ReturnType<RequestHandler>;
};

export const PUT: RequestHandler = async (request) => {
	return (await handleUpdateLinkedAccounts(request, 'api-route')) as ReturnType<RequestHandler>;
};
