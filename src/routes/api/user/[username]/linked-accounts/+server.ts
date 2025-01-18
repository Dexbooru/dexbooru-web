import {
	handleDeleteUserLinkedAccount,
	handleGetUserLinkedAccounts,
} from '$lib/server/controllers/linkedAccounts';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (request) => {
	return (await handleGetUserLinkedAccounts(request)) as ReturnType<RequestHandler>;
};

export const DELETE: RequestHandler = async (request) => {
	return (await handleDeleteUserLinkedAccount(request)) as ReturnType<RequestHandler>;
};
